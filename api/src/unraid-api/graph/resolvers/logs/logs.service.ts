import { Injectable, Logger } from '@nestjs/common';
import { readdir, readFile, stat } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join, basename } from 'node:path';
import { createInterface } from 'node:readline';
import * as chokidar from 'chokidar';

import { getters } from '@app/store/index.js';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';

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
}

@Injectable()
export class LogsService {
  private readonly logger = new Logger(LogsService.name);
  private readonly logWatchers = new Map<string, { watcher: chokidar.FSWatcher; position: number }>();
  private readonly DEFAULT_LINES = 100;

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
            modifiedAt: fileStat.mtime
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
   */
  async getLogFileContent(path: string, lines = this.DEFAULT_LINES): Promise<LogFileContent> {
    try {
      // Validate that the path is within the log directory
      const normalizedPath = join(this.logBasePath, basename(path));
      
      // Count total lines
      const totalLines = await this.countFileLines(normalizedPath);
      
      // Read the last N lines
      const content = await this.readLastLines(normalizedPath, lines);
      
      return {
        path: normalizedPath,
        content,
        totalLines
      };
    } catch (error: unknown) {
      this.logger.error(`Error reading log file: ${error}`);
      throw new Error(`Failed to read log file: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Get the subscription channel for a log file
   * @param path Path to the log file
   */
  getLogFileSubscriptionChannel(path: string): PUBSUB_CHANNEL {
    const normalizedPath = join(this.logBasePath, basename(path));
    
    // Start watching the file if not already watching
    if (!this.logWatchers.has(normalizedPath)) {
      this.startWatchingLogFile(normalizedPath);
    }
    
    return PUBSUB_CHANNEL.LOG_FILE;
  }

  /**
   * Start watching a log file for changes using chokidar
   * @param path Path to the log file
   */
  private async startWatchingLogFile(path: string): Promise<void> {
    try {
      // Get initial file size
      const stats = await stat(path);
      let position = stats.size;
      
      // Create a watcher for the file using chokidar
      const watcher = chokidar.watch(path, {
        persistent: true,
        awaitWriteFinish: {
          stabilityThreshold: 300,
          pollInterval: 100
        }
      });
      
      watcher.on('change', async () => {
        try {
          const newStats = await stat(path);
          
          // If the file has grown
          if (newStats.size > position) {
            // Read only the new content
            const stream = createReadStream(path, { 
              start: position,
              end: newStats.size - 1
            });
            
            let newContent = '';
            stream.on('data', (chunk) => {
              newContent += chunk.toString();
            });
            
            stream.on('end', () => {
              if (newContent) {
                pubsub.publish(PUBSUB_CHANNEL.LOG_FILE, { 
                  logFile: {
                    path,
                    content: newContent,
                    totalLines: 0 // We don't need to count lines for updates
                  }
                });
              }
              
              // Update position for next read
              position = newStats.size;
            });
          } else if (newStats.size < position) {
            // File was truncated, reset position and read from beginning
            position = 0;
            this.logger.debug(`File ${path} was truncated, resetting position`);
            
            // Read the entire file content
            const content = await this.getLogFileContent(path);
            
            pubsub.publish(PUBSUB_CHANNEL.LOG_FILE, { 
              logFile: content
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
      this.logWatchers.set(path, { watcher, position });
      
      this.logger.debug(`Started watching log file with chokidar: ${path}`);
    } catch (error: unknown) {
      this.logger.error(`Error setting up chokidar file watcher for ${path}: ${error}`);
    }
  }

  /**
   * Stop watching a log file
   * @param path Path to the log file
   */
  public stopWatchingLogFile(path: string): void {
    const normalizedPath = join(this.logBasePath, basename(path));
    const watcher = this.logWatchers.get(normalizedPath);
    if (watcher) {
      watcher.watcher.close();
      this.logWatchers.delete(normalizedPath);
      this.logger.debug(`Stopped watching log file: ${normalizedPath}`);
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
        crlfDelay: Infinity
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
        crlfDelay: Infinity
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
} 