import { Injectable, Logger, Module, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { readFile } from 'fs/promises';
import path from 'path';

import { writeFile } from 'atomically';

import { PATHS_CONFIG_MODULES } from '@app/environment.js';

const OS_VERSION_FILE_PATH = '/etc/unraid-version';
const VERSION_TRACKER_FILE = 'os-version-tracker.json';

type OsVersionTrackerState = {
    lastTrackedVersion?: string;
    updatedAt?: string;
};

@Injectable()
export class OsVersionTracker implements OnApplicationBootstrap {
    private readonly logger = new Logger(OsVersionTracker.name);
    private readonly trackerPath = path.join(PATHS_CONFIG_MODULES, VERSION_TRACKER_FILE);

    constructor(private readonly configService: ConfigService) {}

    async onApplicationBootstrap() {
        const currentVersion = await this.readCurrentVersion();
        if (!currentVersion) {
            this.configService.set('api.currentOsVersion', undefined);
            this.configService.set('store.emhttp.var.version', undefined);
            this.configService.set('api.lastSeenOsVersion', undefined);
            return;
        }

        const previousState = await this.readTrackerState();
        const lastTrackedVersion = previousState?.lastTrackedVersion;

        this.configService.set('api.currentOsVersion', currentVersion);
        this.configService.set('store.emhttp.var.version', currentVersion);
        this.configService.set('api.lastSeenOsVersion', lastTrackedVersion);

        if (lastTrackedVersion !== currentVersion) {
            await this.writeTrackerState({
                lastTrackedVersion: currentVersion,
                updatedAt: new Date().toISOString(),
            });
        }
    }

    private async readCurrentVersion(): Promise<string | undefined> {
        try {
            const contents = await readFile(OS_VERSION_FILE_PATH, 'utf8');
            const match = contents.match(/^\s*version\s*=\s*"([^"]+)"\s*$/m);
            return match?.[1]?.trim() || undefined;
        } catch (error) {
            this.logger.error(error, `Failed to read current OS version from ${OS_VERSION_FILE_PATH}`);
            return undefined;
        }
    }

    private async readTrackerState(): Promise<OsVersionTrackerState | undefined> {
        try {
            const content = await readFile(this.trackerPath, 'utf8');
            return JSON.parse(content) as OsVersionTrackerState;
        } catch (error) {
            this.logger.debug(error, `Unable to read OS version tracker state at ${this.trackerPath}`);
            return undefined;
        }
    }

    private async writeTrackerState(state: OsVersionTrackerState): Promise<void> {
        try {
            await writeFile(this.trackerPath, JSON.stringify(state, null, 2), { mode: 0o644 });
        } catch (error) {
            this.logger.error(error, 'Failed to persist OS version tracker state');
        }
    }
}

@Module({
    providers: [OsVersionTracker],
    exports: [OsVersionTracker],
})
export class OsVersionTrackerModule {}
