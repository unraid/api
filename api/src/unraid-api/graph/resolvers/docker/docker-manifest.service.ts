import { Injectable } from '@nestjs/common';

import { AsyncMutex } from '@unraid/shared/util/processing.js';

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

    /**
     * Checks if an update is available for a given container image.
     * @param imageRef - The image reference to check, e.g. "unraid/baseimage:latest". If no tag is provided, "latest" is assumed, following the webgui's implementation.
     * @param cacheData read from /var/lib/docker/unraid-update-status.json by default
     * @returns True if an update is available, false if not, or null if the status is unknown
     */
    async isUpdateAvailableCached(imageRef: string, cacheData?: Record<string, CachedStatusEntry>) {
        let taggedRef = imageRef;
        if (!taggedRef.includes(':')) taggedRef += ':latest';

        cacheData ??= await this.dockerPhpService.readCachedUpdateStatus();
        const containerData = cacheData[taggedRef];
        if (!containerData) return null;

        const normalize = (digest?: string | null) => {
            const value = digest?.trim().toLowerCase();
            return value && value !== 'undef' ? value : null;
        };

        const localDigest = normalize(containerData.local);
        const remoteDigest = normalize(containerData.remote);
        if (localDigest && remoteDigest) {
            return localDigest !== remoteDigest;
        }

        const status = containerData.status?.toLowerCase();
        if (status === 'true') return true;
        if (status === 'false') return false;
        return null;
    }

    /**
     * Checks if a container is rebuild ready.
     * @param networkMode - The network mode of the container, e.g. "container:unraid/baseimage:latest".
     * @returns True if the container is rebuild ready, false if not
     */
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
