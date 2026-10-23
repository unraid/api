import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';

import { z } from 'zod';

import { phpLoader } from '@app/core/utils/plugins/php-loader.js';
import {
    ExplicitStatusItem,
    UpdateStatus,
} from '@app/unraid-api/graph/resolvers/docker/docker-update-status.model.js';
import { parseDockerPushCalls } from '@app/unraid-api/graph/resolvers/docker/utils/docker-push-parser.js';

type StatusItem = { name: string; updateStatus: 0 | 1 | 2 | 3 };

/**
 * These types reflect the structure of the /var/lib/docker/unraid-update-status.json file,
 * which is not controlled by the Unraid API.
 *
 * The webgui (DockerClient.php) writes `local`/`remote` as null when a digest can't be
 * resolved and `status` as the literal string 'undef' when the comparison is unknown
 * (common for stopped or locally-built containers). The schema must tolerate those shapes,
 * otherwise a single such entry would fail validation for the entire file.
 */
const CachedStatusEntrySchema = z.object({
    /** sha256 digest - "sha256:...", or null when unresolved */
    local: z.string().nullable().optional(),
    /** sha256 digest - "sha256:...", or null when unresolved */
    remote: z.string().nullable().optional(),
    /** 'true'/'false' when known, 'undef' or null when unknown */
    status: z.string().nullable().optional(),
});
export type CachedStatusEntry = z.infer<typeof CachedStatusEntrySchema>;

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
    async readCachedUpdateStatus(
        cacheFile = '/var/lib/docker/unraid-update-status.json'
    ): Promise<Record<string, CachedStatusEntry>> {
        try {
            const cache = await readFile(cacheFile, 'utf8');
            const cacheData: unknown = JSON.parse(cache);
            if (cacheData === null || typeof cacheData !== 'object') {
                this.logger.warn(cacheData, 'Invalid cached update status');
                return {};
            }
            // Parse per-entry so one malformed container doesn't discard the whole file.
            const result: Record<string, CachedStatusEntry> = {};
            for (const [image, entry] of Object.entries(cacheData)) {
                const { success, data } = CachedStatusEntrySchema.safeParse(entry);
                if (success) {
                    result[image] = data;
                } else {
                    this.logger.warn(entry, `Skipping invalid cached update status for ${image}`);
                }
            }
            return result;
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
        const matches = parseDockerPushCalls(js);
        return matches.map(({ name, updateStatus }) => ({
            name,
            updateStatus: this.updateStatusToString(updateStatus as StatusItem['updateStatus']),
        }));
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

    /**
     * Gets the update statuses for all containers by triggering `DockerTemplates->getAllInfo(true)` via DockerContainers.php
     * @param dockerContainersPath - Path to the DockerContainers.php file
     * @returns The update statuses for all containers
     */
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
