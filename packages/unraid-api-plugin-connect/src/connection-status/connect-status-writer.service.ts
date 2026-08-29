import type { OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';
import { rename, unlink, writeFile } from 'node:fs/promises';

import { blankStatus, connectionStatus } from '../tunnel/connect-tunnel.service.js';

@Injectable()
export class ConnectStatusWriterService implements OnApplicationBootstrap, OnModuleDestroy {
    private readonly logger = new Logger(ConnectStatusWriterService.name);
    private pending: Promise<void> = Promise.resolve();
    private stopped = false;
    constructor(private readonly config: ConfigService) {}

    get statusFilePath() {
        return (
            this.config.get<string>('PATHS_CONNECT_STATUS_FILE_PATH') ??
            '/var/local/emhttp/connectStatus.json'
        );
    }
    async onApplicationBootstrap() {
        await this.writeStatus();
    }
    async onModuleDestroy() {
        this.stopped = true;
        await this.pending;
        await unlink(this.statusFilePath).catch(() => undefined);
    }
    @OnEvent('connect.tunnel.changed', { async: true })
    async writeStatus(): Promise<void> {
        if (this.stopped) return;
        this.pending = this.pending
            .then(async () => {
                const state = connectionStatus(
                    this.config.get<ReturnType<typeof blankStatus>>('connect.tunnel')
                );
                const data = JSON.stringify({
                    connectionStatus:
                        state.status === 'connected'
                            ? 'CONNECTED'
                            : state.status === 'connecting'
                              ? 'CONNECTING'
                              : 'PRE_INIT',
                    error: state.error,
                    lastPing: null,
                    allowedOrigins: '',
                    timestamp: Date.now(),
                });
                await writeFile(`${this.statusFilePath}.tmp`, data, { mode: 0o600 });
                await rename(`${this.statusFilePath}.tmp`, this.statusFilePath);
            })
            .catch(() => this.logger.warn('Could not write Connect status'));
        await this.pending;
    }
}
