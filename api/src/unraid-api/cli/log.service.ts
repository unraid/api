import { Injectable } from '@nestjs/common';

import { levels, LogLevel } from '@app/core/log.js';
import { LOG_LEVEL, SUPPRESS_LOGS } from '@app/environment.js';

export interface ILogService {
    clear(): void;
    shouldLog(level: LogLevel): boolean;
    table(level: LogLevel, data: unknown, columns?: string[]): void;
    log(...messages: unknown[]): void;
    info(...messages: unknown[]): void;
    warn(...messages: unknown[]): void;
    error(...messages: unknown[]): void;
    always(...messages: unknown[]): void;
    debug(...messages: unknown[]): void;
    trace(...messages: unknown[]): void;
}

@Injectable()
export class LogService implements ILogService {
    private logger = console;
    private suppressLogs = SUPPRESS_LOGS;

    clear(): void {
        if (!this.suppressLogs) {
            this.logger.clear();
        }
    }

    shouldLog(level: LogLevel): boolean {
        if (this.suppressLogs) {
            return false;
        }
        const logLevelsLowToHigh = levels;
        const shouldLog =
            logLevelsLowToHigh.indexOf(level) >=
            logLevelsLowToHigh.indexOf(LOG_LEVEL.toLowerCase() as LogLevel);
        return shouldLog;
    }

    table(level: LogLevel, data: unknown, columns?: string[]) {
        if (this.shouldLog(level)) {
            console.table(data, columns);
        }
    }

    log(...messages: unknown[]): void {
        if (this.shouldLog('info')) {
            this.logger.log(...messages);
        }
    }

    info(...messages: unknown[]): void {
        if (this.shouldLog('info')) {
            this.logger.info(...messages);
        }
    }

    warn(...messages: unknown[]): void {
        if (this.shouldLog('warn')) {
            this.logger.warn(...messages);
        }
    }

    error(...messages: unknown[]): void {
        if (this.shouldLog('error')) {
            this.logger.error(...messages);
        }
    }

    always(...messages: unknown[]): void {
        // Always output to stdout, regardless of log level or suppression
        console.log(...messages);
    }

    debug(...messages: unknown[]): void {
        if (this.shouldLog('debug')) {
            this.logger.debug(...messages);
        }
    }

    trace(...messages: unknown[]): void {
        if (this.shouldLog('trace')) {
            this.logger.log(...messages);
        }
    }
}
