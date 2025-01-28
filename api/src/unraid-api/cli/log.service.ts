import { Injectable } from '@nestjs/common';

import { levels, LogLevel } from '@app/core/log';
import { LOG_LEVEL } from '@app/environment';

@Injectable()
export class LogService {
    private logger = console;

    clear(): void {
        this.logger.clear();
    }

    shouldLog(level: LogLevel): boolean {
        const logLevelsLowToHigh = levels;
        return (
            logLevelsLowToHigh.indexOf(level) >=
            logLevelsLowToHigh.indexOf(LOG_LEVEL.toLowerCase() as LogLevel)
        );
    }

    log(message: string): void {
        if (this.shouldLog('info')) {
            this.logger.log(message);
        }
    }

    info(message: string): void {
        if (this.shouldLog('info')) {
            this.logger.info(message);
        }
    }

    warn(message: string): void {
        if (this.shouldLog('warn')) {
            this.logger.warn(message);
        }
    }

    error(message: string, trace: string = ''): void {
        if (this.shouldLog('error')) {
            this.logger.error(message, trace);
        }
    }

    debug(message: any, ...optionalParams: any[]): void {
        if (this.shouldLog('debug')) {
            this.logger.debug(message, ...optionalParams);
        }
    }
}
