import { Injectable, Logger } from '@nestjs/common';
import { readFile, unlink, writeFile } from 'fs/promises';

import Docker from 'dockerode';

import { getters } from '@app/store/index.js';
import {
    DockerAutostartEntryInput,
    DockerContainer,
} from '@app/unraid-api/graph/resolvers/docker/docker.model.js';

export interface AutoStartEntry {
    name: string;
    wait: number;
    order: number;
}

@Injectable()
export class DockerAutostartService {
    private readonly logger = new Logger(DockerAutostartService.name);
    private autoStartEntries: AutoStartEntry[] = [];
    private autoStartEntryByName = new Map<string, AutoStartEntry>();

    public getAutoStartEntry(name: string): AutoStartEntry | undefined {
        return this.autoStartEntryByName.get(name);
    }

    public setAutoStartEntries(entries: AutoStartEntry[]) {
        this.autoStartEntries = entries;
        this.autoStartEntryByName = new Map(entries.map((entry) => [entry.name, entry]));
    }

    public parseAutoStartEntries(rawContent: string): AutoStartEntry[] {
        const lines = rawContent
            .split('\n')
            .map((line) => line.trim())
            .filter((line) => line.length > 0);

        const seen = new Set<string>();
        const entries: AutoStartEntry[] = [];

        lines.forEach((line, index) => {
            const [name, waitRaw] = line.split(/\s+/);
            if (!name || seen.has(name)) {
                return;
            }
            const parsedWait = Number.parseInt(waitRaw ?? '', 10);
            const wait = Number.isFinite(parsedWait) && parsedWait > 0 ? parsedWait : 0;
            entries.push({
                name,
                wait,
                order: index,
            });
            seen.add(name);
        });

        return entries;
    }

    public async refreshAutoStartEntries(): Promise<void> {
        const autoStartPath = getters.paths()['docker-autostart'];
        const raw = await readFile(autoStartPath, 'utf8')
            .then((file) => file.toString())
            .catch(() => '');
        const entries = this.parseAutoStartEntries(raw);
        this.setAutoStartEntries(entries);
    }

    public sanitizeAutoStartWait(wait?: number | null): number {
        if (wait === null || wait === undefined) return 0;
        const coerced = Number.isInteger(wait) ? wait : Number.parseInt(String(wait), 10);
        if (!Number.isFinite(coerced) || coerced < 0) {
            return 0;
        }
        return coerced;
    }

    public getContainerPrimaryName(container: Docker.ContainerInfo | DockerContainer): string | null {
        const names =
            'Names' in container ? container.Names : 'names' in container ? container.names : undefined;
        const firstName = names?.[0] ?? '';
        return firstName ? firstName.replace(/^\//, '') : null;
    }

    private buildUserPreferenceLines(
        entries: DockerAutostartEntryInput[],
        containerById: Map<string, DockerContainer>
    ): string[] {
        const seenNames = new Set<string>();
        const lines: string[] = [];

        for (const entry of entries) {
            const container = containerById.get(entry.id);
            if (!container) {
                continue;
            }
            const primaryName = this.getContainerPrimaryName(container);
            if (!primaryName || seenNames.has(primaryName)) {
                continue;
            }
            lines.push(`${lines.length}="${primaryName}"`);
            seenNames.add(primaryName);
        }

        return lines;
    }

    /**
     * Docker auto start file
     *
     * @note Doesn't exist if array is offline.
     * @see https://github.com/limetech/webgui/issues/502#issue-480992547
     */
    public async getAutoStarts(): Promise<string[]> {
        await this.refreshAutoStartEntries();
        return this.autoStartEntries.map((entry) => entry.name);
    }

    public async updateAutostartConfiguration(
        entries: DockerAutostartEntryInput[],
        containers: DockerContainer[],
        options?: { persistUserPreferences?: boolean }
    ): Promise<void> {
        const containerById = new Map(containers.map((container) => [container.id, container]));
        const paths = getters.paths();
        const autoStartPath = paths['docker-autostart'];
        const userPrefsPath = paths['docker-userprefs'];
        const persistUserPreferences = Boolean(options?.persistUserPreferences);

        const lines: string[] = [];
        const seenNames = new Set<string>();

        for (const entry of entries) {
            if (!entry.autoStart) {
                continue;
            }
            const container = containerById.get(entry.id);
            if (!container) {
                continue;
            }
            const primaryName = this.getContainerPrimaryName(container);
            if (!primaryName || seenNames.has(primaryName)) {
                continue;
            }
            const wait = this.sanitizeAutoStartWait(entry.wait);
            lines.push(wait > 0 ? `${primaryName} ${wait}` : primaryName);
            seenNames.add(primaryName);
        }

        if (lines.length) {
            await writeFile(autoStartPath, `${lines.join('\n')}\n`, 'utf8');
        } else {
            await unlink(autoStartPath)?.catch((error: NodeJS.ErrnoException) => {
                if (error.code !== 'ENOENT') {
                    throw error;
                }
            });
        }

        if (persistUserPreferences) {
            const userPrefsLines = this.buildUserPreferenceLines(entries, containerById);
            if (userPrefsLines.length) {
                await writeFile(userPrefsPath, `${userPrefsLines.join('\n')}\n`, 'utf8');
            } else {
                await unlink(userPrefsPath)?.catch((error: NodeJS.ErrnoException) => {
                    if (error.code !== 'ENOENT') {
                        throw error;
                    }
                });
            }
        }

        await this.refreshAutoStartEntries();
    }
}
