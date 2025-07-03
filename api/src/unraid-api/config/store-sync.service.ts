import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { Unsubscribe } from '@reduxjs/toolkit';

import { store } from '@app/store/index.js';

@Injectable()
export class StoreSyncService implements OnModuleDestroy {
    private unsubscribe: Unsubscribe;
    private logger = new Logger(StoreSyncService.name);

    constructor(private configService: ConfigService) {
        this.unsubscribe = store.subscribe(() => {
            this.configService.set('store', store.getState());
            this.logger.verbose('Synced store to NestJS Config');
        });
    }

    onModuleDestroy() {
        this.unsubscribe();
    }
}
