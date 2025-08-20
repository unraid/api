import { Injectable } from '@nestjs/common';

import { AsyncMutex } from '@unraid/shared/util/processing.js';

import { phpLoader } from '@app/core/utils/plugins/php-loader.js';

type StatusItem = { name: string; updateStatus: 0 | 1 | 2 | 3 };
type ExplicitStatusItem = {
    name: string;
    updateStatus: 'up to date' | 'update available' | 'rebuild ready' | 'unknown';
};

@Injectable()
export class DockerPhpService {
    constructor() {}

    /**----------------------
     * Refresh Container Digests
     *------------------------**/

    private readonly refreshDigestsMutex = new AsyncMutex(() => {
        return this.refreshDigestsViaPhp();
    });

    /**
     * Recomputes local/remote docker container digests and writes them to /var/lib/docker/unraid-update-status.json
     * @param mutex - Optional mutex to use for the operation. If not provided, a default mutex will be used.
     * @param dockerUpdatePath - Optional path to the DockerUpdate.php file. If not provided, the default path will be used.
     * @returns True if the digests were refreshed, false if the operation failed
     */
    async refreshDigests(mutex = this.refreshDigestsMutex, dockerUpdatePath?: string) {
        return mutex.do(() => {
            return this.refreshDigestsViaPhp(dockerUpdatePath);
        });
    }

    /**
     * Recomputes local/remote digests by triggering `DockerTemplates->getAllInfo(true)` via DockerUpdate.php
     * @param dockerUpdatePath - Path to the DockerUpdate.php file
     * @returns True if the digests were refreshed, false if the file is not found or the operation failed
     */
    private async refreshDigestsViaPhp(
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

    private updateStatusToString(updateStatus: 0): 'up to date';
    private updateStatusToString(updateStatus: 1): 'update available';
    private updateStatusToString(updateStatus: 2): 'rebuild ready';
    private updateStatusToString(updateStatus: 3): 'unknown';
    // prettier-ignore
    private updateStatusToString(updateStatus: StatusItem['updateStatus']): ExplicitStatusItem['updateStatus'];
    private updateStatusToString(
        updateStatus: StatusItem['updateStatus']
    ): ExplicitStatusItem['updateStatus'] {
        switch (updateStatus) {
            case 0:
                return 'up to date';
            case 1:
                return 'update available';
            case 2:
                return 'rebuild ready';
            default:
                return 'unknown';
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
