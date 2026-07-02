import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';

import { execa } from 'execa';

import { getDockerClient } from '@app/unraid-api/graph/resolvers/docker/utils/docker-client.js';

/**
 * cgroup memory.stat fields that the webGUI Docker hook sums to report
 * per-container memory usage. Must stay in sync with
 * webgui/emhttp/plugins/dynamix.docker.manager/system/Docker.
 */
const DOCKER_MEMORY_STAT_FIELDS = new Set([
    'anon',
    'kernel',
    'kernel_stack',
    'pagetables',
    'sec_pagetables',
    'percpu',
    'sock',
    'vmalloc',
    'shmem',
]);

export interface MemoryBreakdownSources {
    /** ZFS ARC cache size in bytes, or null when ZFS is not loaded. */
    zfsCache: number | null;
    /** Active VM balloon RSS in bytes, or null when libvirt is unavailable. */
    vm: number | null;
    /** Active Docker container memory in bytes, or null when Docker is unavailable. */
    docker: number | null;
}

/**
 * Collects the per-category memory usage (ZFS cache, VMs, Docker) that the
 * Unraid dashboard breaks the RAM graph into. Mirrors the executable hook
 * scripts under webgui .../system/*. Results are cached briefly so the 2s
 * memory subscription can select these fields without shelling out repeatedly.
 */
@Injectable()
export class MemoryBreakdownService {
    private readonly logger = new Logger(MemoryBreakdownService.name);
    private static readonly CACHE_TTL_MS = 1500;
    private cache?: { expiresAt: number; sources: Promise<MemoryBreakdownSources> };

    async getSources(): Promise<MemoryBreakdownSources> {
        const now = Date.now();
        if (this.cache && this.cache.expiresAt > now) {
            return this.cache.sources;
        }
        const sources = this.collectSources();
        this.cache = { expiresAt: now + MemoryBreakdownService.CACHE_TTL_MS, sources };
        return sources;
    }

    private async collectSources(): Promise<MemoryBreakdownSources> {
        const [zfsCache, vm, docker] = await Promise.all([
            this.getZfsCache(),
            this.getVmMemory(),
            this.getDockerMemory(),
        ]);
        return { zfsCache, vm, docker };
    }

    /** Reads the ARC `size` (already in bytes) from the ZFS kstat file. */
    async getZfsCache(): Promise<number | null> {
        try {
            const contents = await readFile('/proc/spl/kstat/zfs/arcstats', 'utf8');
            const line = contents.split('\n').find((l) => l.startsWith('size'));
            if (!line) return null;
            const size = Number.parseInt(line.trim().split(/\s+/)[2] ?? '', 10);
            return Number.isFinite(size) ? size : null;
        } catch {
            return null;
        }
    }

    /** Sums `balloon.rss` (reported in KiB) across active domains. */
    async getVmMemory(): Promise<number | null> {
        try {
            const { stdout } = await execa('virsh', ['domstats', '--list-active', '--balloon']);
            let total = 0;
            for (const raw of stdout.split('\n')) {
                const match = /^balloon\.rss=(\d+)$/.exec(raw.trim());
                if (match) total += Number.parseInt(match[1], 10) * 1024;
            }
            return total;
        } catch {
            return null;
        }
    }

    /** Sums the relevant cgroup memory.stat fields across running containers. */
    async getDockerMemory(): Promise<number | null> {
        try {
            const containers = await getDockerClient().listContainers();
            if (containers.length === 0) return 0;
            const perContainer = await Promise.all(
                containers.map((container) => this.getContainerMemory(container.Id))
            );
            return perContainer.reduce((sum, value) => sum + value, 0);
        } catch {
            return null;
        }
    }

    private async getContainerMemory(id: string): Promise<number> {
        try {
            const stat = await readFile(`/sys/fs/cgroup/docker/${id}/memory.stat`, 'utf8');
            let total = 0;
            for (const line of stat.split('\n')) {
                const [field, value] = line.split(/\s+/);
                if (DOCKER_MEMORY_STAT_FIELDS.has(field)) {
                    const bytes = Number.parseInt(value ?? '', 10);
                    if (Number.isFinite(bytes)) total += bytes;
                }
            }
            return total;
        } catch {
            this.logger.debug(`Unable to read memory.stat for container ${id}`);
            return 0;
        }
    }
}
