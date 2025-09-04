import winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { TestInfo } from '@playwright/test';

const { combine, timestamp, printf, colorize } = winston.format;

export class TestLogger {
  private logger: winston.Logger;
  private testInfo: TestInfo | null = null;
  private logFilePath: string | null = null;
  private browserName: string = 'unknown';
  
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        printf(({ level, message, timestamp, testPath, browser, ...meta }) => {
          const testContext = testPath ? `[${testPath}]` : '';
          const browserContext = browser ? `[${browser}]` : '';
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] [${level.toUpperCase()}] ${browserContext} ${testContext} ${message}${metaStr}`;
        })
      ),
      transports: [
        new winston.transports.Console({
          level: 'error',
          format: combine(
            colorize(),
            printf(({ message, browser }) => {
              const browserPrefix = browser ? `[${browser}]` : '';
              return `[TEST] ${browserPrefix} ${message}`;
            })
          )
        })
      ]
    });
  }

  private ensureLogDirectory(testInfo: TestInfo): string {
    const outputDir = process.env.TEST_RESULTS_DIR || 'test-results';
    const browserName = testInfo.project.name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Build simple hierarchy: logs/browser/test-file/suite/test-name/
    const pathParts = [outputDir, 'logs', browserName];
    
    // Add test file name
    const testFileName = path.basename(testInfo.file, '.spec.ts')
      .replace(/[^a-z0-9]/gi, '-').toLowerCase();
    pathParts.push(testFileName);
    
    // Add test suite hierarchy and test name
    const titleParts = testInfo.titlePath.map(part => 
      part.replace(/[^a-z0-9]/gi, '-').toLowerCase()
    );
    pathParts.push(...titleParts);
    
    const logDir = path.join(...pathParts);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    this.browserName = testInfo.project.name;
    
    return path.join(logDir, `${timestamp}.log`);
  }

  attachToTest(testInfo: TestInfo): void {
    this.testInfo = testInfo;
    this.logFilePath = this.ensureLogDirectory(testInfo);
    
    const existingFileTransport = this.logger.transports.find(
      t => t instanceof winston.transports.File
    );
    if (existingFileTransport) {
      this.logger.remove(existingFileTransport);
    }
    
    this.logger.add(
      new winston.transports.File({
        filename: this.logFilePath,
        format: this.logger.format
      })
    );
    
    testInfo.attachments.push({
      name: 'test-logs',
      path: this.logFilePath,
      contentType: 'text/plain'
    });
  }
  
  detachFromTest(): void {
    const fileTransport = this.logger.transports.find(
      t => t instanceof winston.transports.File
    );
    if (fileTransport) {
      this.logger.remove(fileTransport);
    }
    this.testInfo = null;
    this.logFilePath = null;
  }

  private getTestPath(): string {
    if (this.testInfo) {
      return this.testInfo.titlePath.join(' > ');
    }
    return '';
  }

  log(message: string, meta?: any): void {
    this.logger.info(message, { testPath: this.getTestPath(), browser: this.browserName, ...meta });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, { testPath: this.getTestPath(), browser: this.browserName, ...meta });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, { testPath: this.getTestPath(), browser: this.browserName, ...meta });
  }

  error(message: string | Error, meta?: any): void {
    const msg = message instanceof Error ? message.message : message;
    const errorMeta = message instanceof Error ? { stack: message.stack, ...meta } : meta;
    this.logger.error(msg, { testPath: this.getTestPath(), browser: this.browserName, ...errorMeta });
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, { testPath: this.getTestPath(), browser: this.browserName, ...meta });
  }

  verbose(message: string, meta?: any): void {
    this.logger.verbose(message, { testPath: this.getTestPath(), browser: this.browserName, ...meta });
  }

  http(message: string, meta?: any): void {
    this.logger.http(message, { testPath: this.getTestPath(), browser: this.browserName, ...meta });
  }
}

let globalLogger: TestLogger | null = null;

export function getLogger(): TestLogger {
  if (!globalLogger) {
    globalLogger = new TestLogger();
  }
  return globalLogger;
}

export function interceptConsole(logger: TestLogger): () => void {
  const originalConsole = {
    log: console.log,
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: console.debug,
  };

  console.log = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    logger.log(message);
  };

  console.info = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    logger.info(message);
  };

  console.warn = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    logger.warn(message);
  };

  console.error = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    logger.error(message);
  };

  console.debug = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    logger.debug(message);
  };

  return () => {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
    console.debug = originalConsole.debug;
  };
}