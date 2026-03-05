import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { loadDynamixConfigFromDiskSync } from '@app/store/actions/load-dynamix-config-file.js';
import { store } from '@app/store/index.js';
import { updateDynamixConfig } from '@app/store/modules/dynamix.js';
import { FileLoadStatus } from '@app/store/types.js';

const DYNAMIX_REFRESH_INTERVAL_MS = 5000;

@Injectable()
export class DynamixConfigRefreshService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(DynamixConfigRefreshService.name);
    private refreshTimer: NodeJS.Timeout | null = null;
    private lastSerializedConfig: string | null = null;

    onModuleInit() {
        this.refresh();
        this.refreshTimer = setInterval(() => {
            this.refresh();
        }, DYNAMIX_REFRESH_INTERVAL_MS);
    }

    onModuleDestroy() {
        if (!this.refreshTimer) {
            return;
        }

        clearInterval(this.refreshTimer);
        this.refreshTimer = null;
    }

    private refresh() {
        const configPaths = store.getState().paths['dynamix-config'] ?? [];

        try {
            const config = loadDynamixConfigFromDiskSync(configPaths);
            const serializedConfig = JSON.stringify(config);
            if (serializedConfig === this.lastSerializedConfig) {
                return;
            }

            store.dispatch(
                updateDynamixConfig({
                    ...config,
                    status: FileLoadStatus.LOADED,
                })
            );
            this.lastSerializedConfig = serializedConfig;
        } catch (error) {
            this.logger.error(error, 'Failed to refresh dynamix config from disk');
            store.dispatch(
                updateDynamixConfig({
                    status: FileLoadStatus.FAILED_LOADING,
                })
            );
        }
    }
}
