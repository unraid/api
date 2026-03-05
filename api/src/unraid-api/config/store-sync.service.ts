import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Unsubscribe } from '@reduxjs/toolkit';

import { store } from '@app/store/index.js';

const STORE_SYNC_DEBOUNCE_MS = 1000;

@Injectable()
export class StoreSyncService implements OnModuleDestroy {
    private unsubscribe: Unsubscribe;
    private logger = new Logger(StoreSyncService.name);
    private syncTimer: NodeJS.Timeout | null = null;
    private lastSyncedState: string | null = null;

    constructor(private configService: ConfigService) {
        this.unsubscribe = store.subscribe(() => {
            this.scheduleSync();
        });
    }

    private scheduleSync() {
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
        }

        this.syncTimer = setTimeout(() => {
            this.syncTimer = null;
            const state = store.getState();
            const serializedState = JSON.stringify(state);
            if (serializedState === this.lastSyncedState) {
                return;
            }

            this.configService.set('store', state);
            this.lastSyncedState = serializedState;
            this.logger.verbose('Synced store to NestJS Config');
        }, STORE_SYNC_DEBOUNCE_MS);
    }

    onModuleDestroy() {
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
            this.syncTimer = null;
        }

        this.unsubscribe();
    }
}
