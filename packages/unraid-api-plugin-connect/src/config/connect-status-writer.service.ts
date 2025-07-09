import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { writeFile } from 'fs/promises';

import { ConnectionMetadata, ConfigType } from './connect.config.js';

@Injectable()
export class ConnectStatusWriterService implements OnModuleInit {
    constructor(private readonly configService: ConfigService<ConfigType, true>) {}

    private logger = new Logger(ConnectStatusWriterService.name);

    get statusFilePath() {
        // Write to /var/local/emhttp/connectStatus.json so PHP can read it
        return '/var/local/emhttp/connectStatus.json';
    }

    async onModuleInit() {
        this.logger.verbose(`Status file path: ${this.statusFilePath}`);
        
        // Write initial status
        await this.writeStatus();
        
        // Listen for changes to connection status
        this.configService.changes$.subscribe({
            next: async (change) => {
                const connectionChanged = change.path && change.path.startsWith('connect.mothership');
                if (connectionChanged) {
                    await this.writeStatus();
                }
            },
            error: (err) => {
                this.logger.error('Error receiving config changes:', err);
            },
        });
    }

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
                timestamp: Date.now()
            };

            const data = JSON.stringify(statusData, null, 2);
            this.logger.verbose(`Writing connection status: ${data}`);
            
            await writeFile(this.statusFilePath, data);
            this.logger.verbose(`Status written to ${this.statusFilePath}`);
        } catch (error) {
            this.logger.error(error, `Error writing status to '${this.statusFilePath}'`);
        }
    }
}