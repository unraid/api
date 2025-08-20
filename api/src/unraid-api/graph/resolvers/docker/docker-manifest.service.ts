import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';

import { ExtendOptions, Got, got as gotClient, OptionsOfTextResponseBody } from 'got';

import { docker } from '@app/core/utils/index.js';

/** Accept header for Docker API manifest listing */
const ACCEPT_MANIFEST =
    'application/vnd.docker.distribution.manifest.list.v2+json,application/vnd.docker.distribution.manifest.v2+json,application/vnd.oci.image.index.v1+json';

export type CachedStatusEntry = {
    /** sha256 digest - "sha256:..." */
    local: string;
    /** sha256 digest - "sha256:..." */
    remote: string;
    /** whether update is available (true), not available (false), or unknown (null) */
    status: 'true' | 'false' | null;
};

@Injectable()
export class DockerManifestService {
    constructor() {}

    async readCachedUpdateStatus(cacheFile = '/var/lib/docker/unraid-update-status.json') {
        const cache = await readFile(cacheFile, 'utf8');
        const cacheData = JSON.parse(cache);
        return cacheData as Record<string, CachedStatusEntry>;
    }

    async isUpdateAvailableCached(imageRef: string, cacheData?: Record<string, CachedStatusEntry>) {
        let taggedRef = imageRef;
        if (!taggedRef.includes(':')) taggedRef += ':latest';

        cacheData ??= await this.readCachedUpdateStatus();
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
