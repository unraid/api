import { writePrivateJson } from '../config/private-json-file.js';

function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
}
export const object = (value: unknown): Record<string, unknown> => (isObject(value) ? value : {});
const text = (value: unknown): string | null => (typeof value === 'string' ? value : null);
const numeric = (value: unknown): number | null =>
    typeof value === 'number' && Number.isFinite(value) ? value : null;

export type WorkloadStates = {
    docker: string[] | null;
    virtualMachines: string[] | null;
};

const workloadSummary = (
    states: string[] | null,
    runningStates: ReadonlySet<string>,
    pausedStates: ReadonlySet<string>
) => {
    if (states === null) return { state: 'unavailable', running: 0, stopped: 0, paused: 0, total: 0 };
    const running = states.filter((state) => runningStates.has(state)).length;
    const paused = states.filter((state) => pausedStates.has(state)).length;
    return {
        state: 'available',
        running,
        stopped: states.length - running - paused,
        paused,
        total: states.length,
    };
};

export function overview(
    vars: unknown,
    disks: unknown,
    urls: unknown,
    bootTime: string | null,
    workloads?: WorkloadStates
) {
    const system = object(vars);
    const groups = new Map<string, Record<string, unknown>[]>();
    if (Array.isArray(disks))
        for (const value of disks) {
            const disk = object(value);
            const name = text(disk.name);
            if (!name || !['ARRAY', 'PARITY', 'CACHE'].includes(String(disk.type))) continue;
            const id = disk.type === 'CACHE' ? `pool:${name.replace(/\d+$/, '')}` : 'array:array';
            groups.set(id, [...(groups.get(id) ?? []), disk]);
        }
    return {
        schemaVersion: 1,
        info: { os: { release: text(system.version), hostname: text(system.name), uptime: bootTime } },
        storage: {
            pools: Object.fromEntries(
                [...groups].map(([id, entries]) => {
                    const primary = entries.find((disk) => disk.type !== 'PARITY') ?? entries[0];
                    const capacityDisks = id.startsWith('array:')
                        ? entries.filter((disk) => disk.type !== 'PARITY')
                        : [primary];
                    const capacity = (key: string) => {
                        const values = capacityDisks.map((disk) => numeric(disk[key]));
                        return values.every((value) => value !== null)
                            ? values.reduce((sum, value) => sum + value, 0)
                            : null;
                    };
                    return [
                        id,
                        {
                            id,
                            name: id.slice(id.indexOf(':') + 1),
                            kind: id.startsWith('array:') ? 'array' : 'pool',
                            state: text(system.mdState),
                            status: null,
                            fsType: text(primary.fsType),
                            profile: null,
                            fsSize: capacity('fsSize'),
                            fsFree: capacity('fsFree'),
                            fsUsed: capacity('fsUsed'),
                            warnings: [],
                            drives: Object.fromEntries(
                                entries.map((disk) => {
                                    const name = String(disk.name);
                                    return [
                                        `drive:${name}`,
                                        {
                                            id: `drive:${name}`,
                                            name,
                                            role: text(disk.type),
                                            state: text(disk.fsStatus),
                                            status: text(disk.status),
                                            fsSize: numeric(disk.fsSize),
                                            fsFree: numeric(disk.fsFree),
                                            fsUsed: numeric(disk.fsUsed),
                                            warnings:
                                                (numeric(disk.numErrors) ?? 0) > 0
                                                    ? [{ code: 'disk_errors', severity: 'warning' }]
                                                    : [],
                                        },
                                    ];
                                })
                            ),
                        },
                    ];
                })
            ),
        },
        network: {
            accessUrls: Array.isArray(urls)
                ? urls.map((value: unknown) => {
                      const url = object(value);
                      const address = (value: unknown) =>
                          value instanceof URL ? value.toString() : text(value);
                      return {
                          type: text(url.type) ?? 'LAN',
                          name: text(url.name),
                          url: address(url.url),
                          ipv4: address(url.ipv4),
                          ipv6: address(url.ipv6),
                      };
                  })
                : [],
        },
        ...(workloads && {
            workloads: {
                docker: workloadSummary(workloads.docker, new Set(['RUNNING']), new Set(['PAUSED'])),
                virtualMachines: workloadSummary(
                    workloads.virtualMachines,
                    new Set(['RUNNING', 'IDLE']),
                    new Set(['PAUSED', 'PMSUSPENDED'])
                ),
            },
        }),
    };
}

export async function writeOverview(path: string, data: ReturnType<typeof overview>): Promise<void> {
    await writePrivateJson(path, JSON.stringify(data));
}
