import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { createReadStream } from 'node:fs';
import { readdir, stat } from 'node:fs/promises';
import { basename, join } from 'node:path';
import { createInterface } from 'node:readline';

import * as chokidar from 'chokidar';

import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { getters } from '@app/store/index.js';
import { SubscriptionTrackerService } from '@app/unraid-api/graph/services/subscription-tracker.service.js';

interface LogFile {
    name: string;
    path: string;
    size: number;
    modifiedAt: Date;
}

interface LogFileContent {
    path: string;
    content: string;
    totalLines: number;
    startLine?: number;
}

@Injectable()
export class LogsService implements OnModuleInit {
    private readonly logger = new Logger(LogsService.name);
    private readonly logWatchers = new Map<string, { watcher: chokidar.FSWatcher; position: number }>();
    private readonly DEFAULT_LINES = 100;

    constructor(private readonly subscriptionTracker: SubscriptionTrackerService) {}

    onModuleInit() {
        // Log file subscriptions are registered dynamically as needed
        this.logger.debug('LogsService initialized');
    }

    /**
     * Get the base path for log files
     */
    private get logBasePath(): string {
        return getters.paths()['unraid-log-base'];
    }

    /**
     * List all log files in the log directory
     */
    async listLogFiles(): Promise<LogFile[]> {
        try {
            const files = await readdir(this.logBasePath);

            const logFiles: LogFile[] = [];

            for (const file of files) {
                const filePath = join(this.logBasePath, file);
                const fileStat = await stat(filePath);
                if (fileStat.isFile()) {
                    logFiles.push({
                        name: file,
                        path: filePath,
                        size: fileStat.size,
                        modifiedAt: fileStat.mtime,
                    });
                }
            }

            return logFiles;
        } catch (error) {
            this.logger.error(`Error listing log files: ${error}`);
            return [];
        }
    }

    /**
     * Get the content of a log file
     * @param path Path to the log file
     * @param lines Number of lines to read from the end of the file (default: 100)
     * @param startLine Optional starting line number (1-indexed)
     */
    async getLogFileContent(
        path: string,
        lines = this.DEFAULT_LINES,
        startLine?: number
    ): Promise<LogFileContent> {
        try {
            // Validate that the path is within the log directory
            const normalizedPath = join(this.logBasePath, basename(path));

            // Count total lines
            const totalLines = await this.countFileLines(normalizedPath);

            let content: string;

            if (startLine !== undefined) {
                // Read from specific starting line
                content = await this.readLinesFromPosition(normalizedPath, startLine, lines);
            } else {
                // Read the last N lines (default behavior)
                content = await this.readLastLines(normalizedPath, lines);
            }

            return {
                path: normalizedPath,
                content,
                totalLines,
                startLine: startLine !== undefined ? startLine : Math.max(1, totalLines - lines + 1),
            };
        } catch (error: unknown) {
            this.logger.error(`Error reading log file: ${error}`);
            throw new Error(
                `Failed to read log file: ${error instanceof Error ? error.message : String(error)}`
            );
        }
    }

    /**
     * Register and get the topic key for a log file subscription
     * @param path Path to the log file
     * @returns The subscription topic key
     */
    registerLogFileSubscription(path: string): string {
        const normalizedPath = join(this.logBasePath, basename(path));
        const topicKey = this.getTopicKey(normalizedPath);

        // Register the topic if not already registered
        if (!this.subscriptionTracker.getSubscriberCount(topicKey)) {
            this.logger.debug(`Registering log file subscription topic: ${topicKey}`);

            this.subscriptionTracker.registerTopic(
                topicKey,
                // onStart handler
                () => {
                    this.logger.debug(`Starting log file watcher for topic: ${topicKey}`);
                    this.startWatchingLogFile(normalizedPath);
                },
                // onStop handler
                () => {
                    this.logger.debug(`Stopping log file watcher for topic: ${topicKey}`);
                    this.stopWatchingLogFile(normalizedPath);
                }
            );
        }

        return topicKey;
    }

    /**
     * Start watching a log file for changes using chokidar
     * @param path Path to the log file
     */
    private startWatchingLogFile(path: string): void {
        const watcherKey = path;

        // If already watching, don't create a new watcher
        if (this.logWatchers.has(watcherKey)) {
            this.logger.debug(`Already watching log file: ${watcherKey}`);
            return;
        }

        // Get initial file size and set up watcher
        stat(path)
            .then((stats) => {
                let position = stats.size;

                // Create a watcher for the file using chokidar
                const watcher = chokidar.watch(path, {
                    persistent: true,
                    awaitWriteFinish: {
                        stabilityThreshold: 300,
                        pollInterval: 100,
                    },
                });

                watcher.on('change', async () => {
                    try {
                        const newStats = await stat(path);

                        // If the file has grown
                        if (newStats.size > position) {
                            // Read only the new content
                            const stream = createReadStream(path, {
                                start: position,
                                end: newStats.size - 1,
                            });

                            let newContent = '';
                            stream.on('data', (chunk) => {
                                newContent += chunk.toString();
                            });

                            stream.on('end', () => {
                                if (newContent) {
                                    // Use topic-specific channel
                                    const topicKey = this.getTopicKey(path);
                                    pubsub.publish(topicKey, {
                                        logFile: {
                                            path,
                                            content: newContent,
                                            totalLines: 0, // We don't need to count lines for updates
                                        },
                                    });
                                }

                                // Update position for next read
                                position = newStats.size;
                            });

                            stream.on('error', (error) => {
                                this.logger.error(`Error reading stream for ${path}: ${error}`);
                            });
                        } else if (newStats.size < position) {
                            // File was truncated, reset position and read from beginning
                            position = 0;
                            this.logger.debug(`File ${path} was truncated, resetting position`);

                            // Read the entire file content
                            const content = await this.getLogFileContent(
                                path,
                                this.DEFAULT_LINES,
                                undefined
                            );

                            // Use topic-specific channel
                            const topicKey = this.getTopicKey(path);
                            pubsub.publish(topicKey, {
                                logFile: {
                                    ...content,
                                },
                            });

                            position = newStats.size;
                        }
                    } catch (error: unknown) {
                        this.logger.error(`Error processing file change for ${path}: ${error}`);
                    }
                });

                watcher.on('error', (error) => {
                    this.logger.error(`Chokidar watcher error for ${path}: ${error}`);
                });

                // Store the watcher and current position
                this.logWatchers.set(watcherKey, { watcher, position });

                // Publish initial snapshot
                this.getLogFileContent(path, this.DEFAULT_LINES, undefined)
                    .then((content) => {
                        const topicKey = this.getTopicKey(path);
                        pubsub.publish(topicKey, {
                            logFile: {
                                ...content,
                            },
                        });
                    })
                    .catch((error) => {
                        this.logger.error(`Error publishing initial log content for ${path}: ${error}`);
                    });

                this.logger.debug(`Started watching log file with chokidar: ${path}`);
            })
            .catch((error) => {
                this.logger.error(`Error setting up file watcher for ${path}: ${error}`);
            });
    }

    /**
     * Get the topic key for a log file subscription
     * @param path Path to the log file (should already be normalized)
     * @returns The topic key
     */
    private getTopicKey(path: string): string {
        // Assume path is already normalized (full path)
        return `LOG_FILE:${path}`;
    }

    /**
     * Stop watching a log file
     * @param path Path to the log file
     */
    private stopWatchingLogFile(path: string): void {
        const watcherKey = path;
        const watcher = this.logWatchers.get(watcherKey);

        if (watcher) {
            watcher.watcher.close();
            this.logWatchers.delete(watcherKey);
            this.logger.debug(`Stopped watching log file: ${watcherKey}`);
        }
    }

    /**
     * Count the number of lines in a file
     * @param filePath Path to the file
     */
    private async countFileLines(filePath: string): Promise<number> {
        return new Promise((resolve, reject) => {
            let lineCount = 0;
            const stream = createReadStream(filePath);
            const rl = createInterface({
                input: stream,
                crlfDelay: Infinity,
            });

            rl.on('line', () => {
                lineCount++;
            });

            rl.on('close', () => {
                resolve(lineCount);
            });

            rl.on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Read the last N lines of a file
     * @param filePath Path to the file
     * @param lineCount Number of lines to read
     */
    private async readLastLines(filePath: string, lineCount: number): Promise<string> {
        const totalLines = await this.countFileLines(filePath);
        const linesToSkip = Math.max(0, totalLines - lineCount);

        return new Promise((resolve, reject) => {
            let currentLine = 0;
            let content = '';

            const stream = createReadStream(filePath);
            const rl = createInterface({
                input: stream,
                crlfDelay: Infinity,
            });

            rl.on('line', (line) => {
                currentLine++;
                if (currentLine > linesToSkip) {
                    content += line + '\n';
                }
            });

            rl.on('close', () => {
                resolve(content);
            });

            rl.on('error', (err) => {
                reject(err);
            });
        });
    }

    /**
     * Read lines from a specific position in the file
     * @param filePath Path to the file
     * @param startLine Starting line number (1-indexed)
     * @param lineCount Number of lines to read
     */
    private async readLinesFromPosition(
        filePath: string,
        startLine: number,
        lineCount: number
    ): Promise<string> {
        return new Promise((resolve, reject) => {
            let currentLine = 0;
            let content = '';
            let linesRead = 0;

            const stream = createReadStream(filePath);
            const rl = createInterface({
                input: stream,
                crlfDelay: Infinity,
            });

            rl.on('line', (line) => {
                currentLine++;

                // Skip lines before the starting position
                if (currentLine >= startLine) {
                    // Only read the requested number of lines
                    if (linesRead < lineCount) {
                        content += line + '\n';
                        linesRead++;
                    } else {
                        // We've read enough lines, close the stream
                        rl.close();
                    }
                }
            });

            rl.on('close', () => {
                resolve(content);
            });

            rl.on('error', (err) => {
                reject(err);
            });
        });
    }
}
