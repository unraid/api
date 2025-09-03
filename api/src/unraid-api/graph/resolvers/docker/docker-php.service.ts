import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';

import { phpLoader } from '@app/core/utils/plugins/php-loader.js';

type StatusItem = { name: string; updateStatus: 0 | 1 | 2 | 3 };

/** Note that these values propogate down to api consumers, so be aware of breaking changes. */
enum UpdateStatus {
    UP_TO_DATE = 'UP_TO_DATE',
    UPDATE_AVAILABLE = 'UPDATE_AVAILABLE',
    REBUILD_READY = 'REBUILD_READY',
    UNKNOWN = 'UNKNOWN',
}

type ExplicitStatusItem = {
    name: string;
    updateStatus: UpdateStatus;
};

/**
 * These types reflect the structure of the /var/lib/docker/unraid-update-status.json file,
 * which is not controlled by the Unraid API.
 */
export type CachedStatusEntry = {
    /** sha256 digest - "sha256:..." */
    local: string;
    /** sha256 digest - "sha256:..." */
    remote: string;
    /** whether update is available (true), not available (false), or unknown (null) */
    status: 'true' | 'false' | null;
};

@Injectable()
export class DockerPhpService {
    private readonly logger = new Logger(DockerPhpService.name);
    constructor() {}

    /**
     * Reads JSON from a file containing cached update status.
     * If the file does not exist, an empty object is returned.
     * @param cacheFile
     * @returns
     */
    async readCachedUpdateStatus(cacheFile = '/var/lib/docker/unraid-update-status.json') {
        try {
            const cache = await readFile(cacheFile, 'utf8');
            const cacheData = JSON.parse(cache);
            return cacheData as Record<string, CachedStatusEntry>;
        } catch (error) {
            this.logger.warn(error, 'Failed to read cached update status');
            return {};
        }
    }

    /**----------------------
     * Refresh Container Digests
     *------------------------**/

    /**
     * Recomputes local/remote digests by triggering `DockerTemplates->getAllInfo(true)` via DockerUpdate.php
     * @param dockerUpdatePath - Path to the DockerUpdate.php file
     * @returns True if the digests were refreshed, false if the file is not found or the operation failed
     */
    async refreshDigestsViaPhp(
        dockerUpdatePath = '/usr/local/emhttp/plugins/dynamix.docker.manager/include/DockerUpdate.php'
    ) {
        try {
            await phpLoader({
                file: dockerUpdatePath,
                method: 'GET',
            });
            return true;
        } catch {
            // ignore; offline may keep remote as 'undef'
            return false;
        }
    }

    /**----------------------
     * Parse Container Statuses
     *------------------------**/

    private parseStatusesFromDockerPush(js: string): ExplicitStatusItem[] {
        const items: ExplicitStatusItem[] = [];
        const re = /docker\.push\(\{[^}]*name:'([^']+)'[^}]*update:(\d)[^}]*\}\);/g;
        for (const m of js.matchAll(re)) {
            const name = m[1];
            const updateStatus = Number(m[2]) as StatusItem['updateStatus'];
            items.push({ name, updateStatus: this.updateStatusToString(updateStatus) });
        }
        return items;
    }

    private updateStatusToString(updateStatus: 0): UpdateStatus.UP_TO_DATE;
    private updateStatusToString(updateStatus: 1): UpdateStatus.UPDATE_AVAILABLE;
    private updateStatusToString(updateStatus: 2): UpdateStatus.REBUILD_READY;
    private updateStatusToString(updateStatus: 3): UpdateStatus.UNKNOWN;
    // prettier-ignore
    private updateStatusToString(updateStatus: StatusItem['updateStatus']): ExplicitStatusItem['updateStatus'];
    private updateStatusToString(
        updateStatus: StatusItem['updateStatus']
    ): ExplicitStatusItem['updateStatus'] {
        switch (updateStatus) {
            case 0:
                return UpdateStatus.UP_TO_DATE;
            case 1:
                return UpdateStatus.UPDATE_AVAILABLE;
            case 2:
                return UpdateStatus.REBUILD_READY;
            default:
                return UpdateStatus.UNKNOWN;
        }
    }

    async getContainerUpdateStatuses(
        dockerContainersPath = '/usr/local/emhttp/plugins/dynamix.docker.manager/include/DockerContainers.php'
    ): Promise<ExplicitStatusItem[]> {
        const stdout = await phpLoader({
            file: dockerContainersPath,
            method: 'GET',
        });
        const parts = stdout.split('\0'); // [html, "docker.push(...)", busyFlag]
        const js = parts[1] || '';
        return this.parseStatusesFromDockerPush(js);
    }
}
