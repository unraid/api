import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { dirname } from 'path';

import { ConfigType, ConnectionMetadata } from '../config/connect.config.js';
import { EVENTS } from '../helper/nest-tokens.js';

@Injectable()
export class ConnectStatusWriterService implements OnApplicationBootstrap, OnModuleDestroy {
    constructor(private readonly configService: ConfigService<ConfigType, true>) {}

    private logger = new Logger(ConnectStatusWriterService.name);

    get statusFilePath() {
        // Use environment variable if set, otherwise default to /var/local/emhttp/connectStatus.json
        return this.configService.get('PATHS_CONNECT_STATUS') || '/var/local/emhttp/connectStatus.json';
    }

    async onApplicationBootstrap() {
        this.logger.verbose(`Status file path: ${this.statusFilePath}`);

        // Write initial status
        await this.writeStatus();
    }

    async onModuleDestroy() {
        try {
            await unlink(this.statusFilePath);
            this.logger.verbose(`Status file deleted: ${this.statusFilePath}`);
        } catch (error) {
            this.logger.debug(`Could not delete status file: ${error}`);
        }
    }

    @OnEvent(EVENTS.MOTHERSHIP_CONNECTION_STATUS_CHANGED, { async: true })
    private async writeStatus() {
        try {
            const connectionMetadata = this.configService.get<ConnectionMetadata>('connect.mothership');

            // Try to get allowed origins from the store
            let allowedOrigins = '';
            try {
                // We can't import from @app here, so we'll skip allowed origins for now
                // This can be added later if needed
                allowedOrigins = '';
            } catch (error) {
                this.logger.debug('Could not get allowed origins:', error);
            }

            const statusData = {
                connectionStatus: connectionMetadata?.status || 'PRE_INIT',
                error: connectionMetadata?.error || null,
                lastPing: connectionMetadata?.lastPing || null,
                allowedOrigins: allowedOrigins,
                timestamp: Date.now(),
            };

            const data = JSON.stringify(statusData, null, 2);
            this.logger.verbose(`Writing connection status: ${data}`);

            // Ensure the directory exists before writing
            const dir = dirname(this.statusFilePath);
            await mkdir(dir, { recursive: true });

            await writeFile(this.statusFilePath, data);
            this.logger.verbose(`Status written to ${this.statusFilePath}`);
        } catch (error) {
            this.logger.error(error, `Error writing status to '${this.statusFilePath}'`);
        }
    }
}
