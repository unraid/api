import { Injectable } from '@nestjs/common';

import { docker } from '@app/core/utils/index.js';
import {
    CachedStatusEntry,
    DockerPhpService,
} from '@app/unraid-api/graph/resolvers/docker/docker-php.service.js';

@Injectable()
export class DockerManifestService {
    constructor(private readonly dockerPhpService: DockerPhpService) {}

    private readonly refreshDigestsMutex = new AsyncMutex(() => {
        return this.dockerPhpService.refreshDigestsViaPhp();
    });

    /**
     * Recomputes local/remote docker container digests and writes them to /var/lib/docker/unraid-update-status.json
     * @param mutex - Optional mutex to use for the operation. If not provided, a default mutex will be used.
     * @param dockerUpdatePath - Optional path to the DockerUpdate.php file. If not provided, the default path will be used.
     * @returns True if the digests were refreshed, false if the operation failed
     */
    async refreshDigests(mutex = this.refreshDigestsMutex, dockerUpdatePath?: string) {
        return mutex.do(() => {
            return this.dockerPhpService.refreshDigestsViaPhp(dockerUpdatePath);
        });
    }

    async isUpdateAvailableCached(imageRef: string, cacheData?: Record<string, CachedStatusEntry>) {
        let taggedRef = imageRef;
        if (!taggedRef.includes(':')) taggedRef += ':latest';

        cacheData ??= await this.dockerPhpService.readCachedUpdateStatus();
        const containerData = cacheData[taggedRef];
        if (!containerData) return null;
        return containerData.status?.toLowerCase() === 'true';
    }

    async isRebuildReady(networkMode?: string) {
        if (!networkMode || !networkMode.startsWith('container:')) return false;
        const target = networkMode.slice('container:'.length);
        try {
            await docker.getContainer(target).inspect();
            return false;
        } catch {
            return true; // unresolved target -> ':???' equivalent
        }
    }
}
