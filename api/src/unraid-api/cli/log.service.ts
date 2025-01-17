import { Injectable } from '@nestjs/common';

@Injectable()
export class LogService {
    private logger = console;

    clear(): void {
        this.logger.clear();
    }

    log(message: string): void {
        this.logger.log(message);
    }

    info(message: string): void {
        this.logger.info(message);
    }

    warn(message: string): void {
        this.logger.warn(message);
    }

    error(message: string, trace: string = ''): void {
        this.logger.error(message, trace);
    }

    debug(message: any, ...optionalParams: any[]): void {
        this.logger.debug(message, ...optionalParams);
    }
}
