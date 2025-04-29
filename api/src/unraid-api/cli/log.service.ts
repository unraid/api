import { Injectable } from '@nestjs/common';

import { levels, LogLevel } from '@app/core/log.js';
import { LOG_LEVEL } from '@app/environment.js';

@Injectable()
export class LogService {
    private logger = console;

    clear(): void {
        this.logger.clear();
    }

    shouldLog(level: LogLevel): boolean {
        const logLevelsLowToHigh = levels;
        const shouldLog =
            logLevelsLowToHigh.indexOf(level) >=
            logLevelsLowToHigh.indexOf(LOG_LEVEL.toLowerCase() as LogLevel);
        return shouldLog;
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
