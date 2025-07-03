import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Unsubscribe } from '@reduxjs/toolkit';
import { isEqual } from 'lodash-es';

import { store } from '@app/store/index.js';

@Injectable()
export class StoreSyncService implements OnModuleDestroy {
    private unsubscribe: Unsubscribe;
    private logger = new Logger(StoreSyncService.name);
    private lastState: object | null = null;

    constructor(private configService: ConfigService) {
        this.unsubscribe = store.subscribe(() => {
            const currentState = store.getState();
            if (isEqual(currentState, this.lastState)) {
                this.logger.debug('Store state unchanged; skipping sync');
                return;
            }
            this.lastState = structuredClone(currentState);
            this.configService.set('store', store.getState());
            this.logger.verbose('Synced store to NestJS Config');
        });
    }

    onModuleDestroy() {
        this.unsubscribe();
    }
}
