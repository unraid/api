import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Unsubscribe } from '@reduxjs/toolkit';

import { store } from '@app/store/index.js';

@Injectable()
export class StoreSyncService implements OnModuleDestroy {
    private unsubscribe: Unsubscribe;
    private logger = new Logger(StoreSyncService.name);
    private lastSyncedState: string | null = null;

    constructor(private configService: ConfigService) {
        this.syncStore();
        this.unsubscribe = store.subscribe(() => {
            this.syncStore();
        });
    }

    private syncStore() {
        const state = store.getState();
        const serializedState = JSON.stringify(state);
        if (serializedState === this.lastSyncedState) {
            return;
        }

        this.configService.set('store', state);
        this.lastSyncedState = serializedState;
        this.logger.verbose('Synced store to NestJS Config');
    }

    onModuleDestroy() {
        this.unsubscribe();
    }
}
