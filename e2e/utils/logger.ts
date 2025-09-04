import winston from 'winston';
import * as path from 'path';
import * as fs from 'fs';
import { TestInfo } from '@playwright/test';

const { combine, timestamp, printf, colorize } = winston.format;

export class TestLogger {
  private logger: winston.Logger;
  private testInfo: TestInfo | null = null;
  private logFilePath: string | null = null;
  
  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        printf(({ level, message, timestamp, testPath, ...meta }) => {
          const testContext = testPath ? `[${testPath}]` : '';
          const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
          return `[${timestamp}] [${level.toUpperCase()}] ${testContext} ${message}${metaStr}`;
        })
      ),
      transports: [
        new winston.transports.Console({
          level: 'error',
          format: combine(
            colorize(),
            printf(({ level, message }) => `[TEST] ${message}`)
          )
        })
      ]
    });
  }

  private ensureLogDirectory(testInfo: TestInfo): string {
    const outputDir = process.env.TEST_RESULTS_DIR || 'test-results';
    const testName = testInfo.titlePath.join(' > ').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const logDir = path.join(outputDir, 'logs');
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    return path.join(logDir, `${testName}-${timestamp}.log`);
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
    this.logger.info(message, { testPath: this.getTestPath(), ...meta });
  }

  info(message: string, meta?: any): void {
    this.logger.info(message, { testPath: this.getTestPath(), ...meta });
  }

  warn(message: string, meta?: any): void {
    this.logger.warn(message, { testPath: this.getTestPath(), ...meta });
  }

  error(message: string | Error, meta?: any): void {
    const msg = message instanceof Error ? message.message : message;
    const errorMeta = message instanceof Error ? { stack: message.stack, ...meta } : meta;
    this.logger.error(msg, { testPath: this.getTestPath(), ...errorMeta });
  }

  debug(message: string, meta?: any): void {
    this.logger.debug(message, { testPath: this.getTestPath(), ...meta });
  }

  verbose(message: string, meta?: any): void {
    this.logger.verbose(message, { testPath: this.getTestPath(), ...meta });
  }

  http(message: string, meta?: any): void {
    this.logger.http(message, { testPath: this.getTestPath(), ...meta });
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