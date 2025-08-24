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
     * @param filter Optional filter to apply to the content
     */
    async getLogFileContent(
        path: string,
        lines = this.DEFAULT_LINES,
        startLine?: number,
        filter?: string
    ): Promise<LogFileContent> {
        try {
            // Validate that the path is within the log directory
            const normalizedPath = join(this.logBasePath, basename(path));

            // Count total lines
            const totalLines = await this.countFileLines(normalizedPath);

            let content: string;

            if (startLine !== undefined) {
                // Read from specific starting line
                content = await this.readLinesFromPosition(normalizedPath, startLine, lines, filter);
            } else {
                // Read the last N lines (default behavior)
                content = await this.readLastLines(normalizedPath, lines, filter);
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
     * @param filter Optional filter to apply
     * @returns The subscription topic key
     */
    registerLogFileSubscription(path: string, filter?: string): string {
        const normalizedPath = join(this.logBasePath, basename(path));
        const topicKey = this.getTopicKey(normalizedPath, filter);

        // Register the topic if not already registered
        if (!this.subscriptionTracker.getSubscriberCount(topicKey)) {
            this.logger.debug(`Registering log file subscription topic: ${topicKey}`);

            this.subscriptionTracker.registerTopic(
                topicKey,
                // onStart handler
                () => {
                    this.logger.debug(`Starting log file watcher for topic: ${topicKey}`);
                    this.startWatchingLogFile(normalizedPath, filter);
                },
                // onStop handler
                () => {
                    this.logger.debug(`Stopping log file watcher for topic: ${topicKey}`);
                    this.stopWatchingLogFile(normalizedPath, filter);
                }
            );
        }

        return topicKey;
    }

    /**
     * Start watching a log file for changes using chokidar
     * @param path Path to the log file
     * @param filter Optional filter to apply
     */
    private startWatchingLogFile(path: string, filter?: string): void {
        const watcherKey = `${path}:${filter || ''}`;

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
                                    // Filter content if filter is provided
                                    const filteredContent = filter
                                        ? this.filterContent(newContent, filter)
                                        : newContent;
                                    if (filteredContent) {
                                        // Use topic-specific channel
                                        const topicKey = this.getTopicKey(path, filter);
                                        pubsub.publish(topicKey, {
                                            logFile: {
                                                path,
                                                content: filteredContent,
                                                totalLines: 0, // We don't need to count lines for updates
                                                filter, // Include filter in payload
                                            },
                                        });
                                    }
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

                            // Read the entire file content with filter
                            const content = await this.getLogFileContent(
                                path,
                                this.DEFAULT_LINES,
                                undefined,
                                filter
                            );

                            // Use topic-specific channel
                            const topicKey = this.getTopicKey(path, filter);
                            pubsub.publish(topicKey, {
                                logFile: {
                                    ...content,
                                    filter, // Include filter in payload
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

                // Publish initial snapshot with filter applied
                this.getLogFileContent(path, this.DEFAULT_LINES, undefined, filter)
                    .then((content) => {
                        const topicKey = this.getTopicKey(path, filter);
                        pubsub.publish(topicKey, {
                            logFile: {
                                ...content,
                                filter, // Include filter in payload
                            },
                        });
                    })
                    .catch((error) => {
                        this.logger.error(`Error publishing initial log content for ${path}: ${error}`);
                    });

                this.logger.debug(
                    `Started watching log file with chokidar: ${path} with filter: ${filter || 'none'}`
                );
            })
            .catch((error) => {
                this.logger.error(`Error setting up file watcher for ${path}: ${error}`);
            });
    }

    /**
     * Get the topic key for a log file subscription
     * @param path Path to the log file (should already be normalized)
     * @param filter Optional filter
     * @returns The topic key
     */
    private getTopicKey(path: string, filter?: string): string {
        // Assume path is already normalized (full path)
        return `LOG_FILE:${path}:${filter || ''}`;
    }

    /**
     * Stop watching a log file
     * @param path Path to the log file
     * @param filter Optional filter that was used when starting the watcher
     */
    private stopWatchingLogFile(path: string, filter?: string): void {
        const watcherKey = `${path}:${filter || ''}`;
        const watcher = this.logWatchers.get(watcherKey);

        if (watcher) {
            watcher.watcher.close();
            this.logWatchers.delete(watcherKey);
            this.logger.debug(`Stopped watching log file: ${watcherKey}`);
        }
    }

    /**
     * Filter content based on a filter string
     * @param content The content to filter
     * @param filter The filter string to apply
     */
    private filterContent(content: string, filter: string): string {
        const lines = content.split('\n');
        // Case-insensitive filter that matches OIDC anywhere in the line
        const filterRegex = new RegExp(filter, 'i');
        const filteredLines = lines.filter((line) => filterRegex.test(line));
        return filteredLines.join('\n');
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
     * @param filter Optional filter to apply
     */
    private async readLastLines(filePath: string, lineCount: number, filter?: string): Promise<string> {
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
                    // Apply filter if provided (case-insensitive)
                    if (!filter || new RegExp(filter, 'i').test(line)) {
                        content += line + '\n';
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

    /**
     * Read lines from a specific position in the file
     * @param filePath Path to the file
     * @param startLine Starting line number (1-indexed)
     * @param lineCount Number of lines to read
     * @param filter Optional filter to apply
     */
    private async readLinesFromPosition(
        filePath: string,
        startLine: number,
        lineCount: number,
        filter?: string
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
                    // Apply filter if provided (case-insensitive)
                    if (!filter || new RegExp(filter, 'i').test(line)) {
                        // Only read the requested number of lines
                        if (linesRead < lineCount) {
                            content += line + '\n';
                            linesRead++;
                        } else {
                            // We've read enough lines, close the stream
                            rl.close();
                        }
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
