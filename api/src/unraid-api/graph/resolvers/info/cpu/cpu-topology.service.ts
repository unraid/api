import { Injectable, Logger } from '@nestjs/common';
import { promises as fs } from 'fs';
import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'path';

const { readdir, readFile, access } = fs;
const { constants: fsConstants } = fs;

@Injectable()
export class CpuTopologyService {
    private readonly logger = new Logger(CpuTopologyService.name);

    private topologyCache: { id: number; cores: number[][] }[] | null = null;

    // -----------------------------------------------------------------
    // Read static CPU topology, per-package core thread pairs
    // -----------------------------------------------------------------
    async generateTopology(): Promise<number[][][]> {
        const packages: Record<number, number[][]> = {};
        const cpuDirs = await readdir('/sys/devices/system/cpu');

        for (const dir of cpuDirs) {
            if (!/^cpu\d+$/.test(dir)) continue;

            const basePath = join('/sys/devices/system/cpu', dir, 'topology');
            const pkgFile = join(basePath, 'physical_package_id');
            const siblingsFile = join(basePath, 'thread_siblings_list');

            try {
                const [pkgIdStr, siblingsStrRaw] = await Promise.all([
                    readFile(pkgFile, 'utf8'),
                    readFile(siblingsFile, 'utf8'),
                ]);

                const pkgId = parseInt(pkgIdStr.trim(), 10);

                // expand ranges
                const siblings = siblingsStrRaw
                    .trim()
                    .replace(/(\d+)-(\d+)/g, (_, start, end) =>
                        Array.from(
                            { length: parseInt(end) - parseInt(start) + 1 },
                            (_, i) => parseInt(start) + i
                        ).join(',')
                    )
                    .split(',')
                    .map((n) => parseInt(n, 10));

                if (!packages[pkgId]) packages[pkgId] = [];
                if (!packages[pkgId].some((arr) => arr.join(',') === siblings.join(','))) {
                    packages[pkgId].push(siblings);
                }
            } catch (err) {
                console.warn('Topology read error for', dir, err);
            }
        }
        // Sort cores within each package, and packages by their lowest core index
        const result = Object.entries(packages)
            .sort((a, b) => a[1][0][0] - b[1][0][0]) // sort packages by first CPU ID
            .map(
                ([pkgId, cores]) => cores.sort((a, b) => a[0] - b[0]) // sort cores within package
            );

        return result;
    }

    // -----------------------------------------------------------------
    // Dynamic telemetry (power + temperature)
    // -----------------------------------------------------------------
    private async getPackageTemps(): Promise<number[]> {
        const temps: number[] = [];
        try {
            const hwmons = await readdir('/sys/class/hwmon');
            for (const hwmon of hwmons) {
                const path = join('/sys/class/hwmon', hwmon);
                try {
                    const label = (await readFile(join(path, 'name'), 'utf8')).trim();
                    if (/coretemp|k10temp|zenpower/i.test(label)) {
                        const files = await readdir(path);
                        for (const f of files) {
                            if (f.startsWith('temp') && f.endsWith('_label')) {
                                const lbl = (await readFile(join(path, f), 'utf8')).trim().toLowerCase();
                                if (
                                    lbl.includes('package id') ||
                                    lbl.includes('tctl') ||
                                    lbl.includes('tdie')
                                ) {
                                    const inputFile = join(path, f.replace('_label', '_input'));
                                    try {
                                        const raw = await readFile(inputFile, 'utf8');
                                        temps.push(parseInt(raw.trim(), 10) / 1000);
                                    } catch (err) {
                                        this.logger.warn('Failed to read file', err);
                                    }
                                }
                            }
                        }
                    }
                } catch (err) {
                    this.logger.warn('Failed to read file', err);
                }
            }
        } catch (err) {
            this.logger.warn('Failed to read file', err);
        }
        return temps;
    }

    private async getPackagePower(): Promise<Record<number, Record<string, number>>> {
        const basePath = '/sys/class/powercap';
        const prefixes = ['intel-rapl', 'intel-rapl-mmio', 'amd-rapl'];
        const raplPaths: string[] = [];

        try {
            const entries = await readdir(basePath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isSymbolicLink() && prefixes.some((p) => entry.name.startsWith(p))) {
                    if (/:\d+:\d+/.test(entry.name)) continue;
                    raplPaths.push(join(basePath, entry.name));
                }
            }
        } catch {
            return {};
        }

        if (!raplPaths.length) return {};

        const readEnergy = async (p: string): Promise<number | null> => {
            try {
                await access(join(p, 'energy_uj'), fsConstants.R_OK);
                const raw = await readFile(join(p, 'energy_uj'), 'utf8');
                return parseInt(raw.trim(), 10);
            } catch {
                return null;
            }
        };

        const prevE = new Map<string, number>();
        const prevT = new Map<string, bigint>();

        for (const p of raplPaths) {
            const val = await readEnergy(p);
            if (val !== null) {
                prevE.set(p, val);
                prevT.set(p, process.hrtime.bigint());
            }
        }

        await new Promise((res) => setTimeout(res, 100));

        const results: Record<number, Record<string, number>> = {};

        for (const p of raplPaths) {
            const now = await readEnergy(p);
            if (now === null) continue;

            const prevVal = prevE.get(p);
            const prevTime = prevT.get(p);
            if (prevVal === undefined || prevTime === undefined) continue;

            const diffE = now - prevVal;
            const diffT = Number(process.hrtime.bigint() - prevTime);
            if (diffT <= 0 || diffE < 0) continue;

            const watts = (diffE * 1e-6) / (diffT * 1e-9);
            const powerW = Math.round(watts * 100) / 100;

            const nameFile = join(p, 'name');
            let label = 'package';
            try {
                label = (await readFile(nameFile, 'utf8')).trim();
            } catch (err) {
                this.logger.warn('Failed to read file', err);
            }

            const pkgMatch = label.match(/package-(\d+)/i);
            const pkgId = pkgMatch ? Number(pkgMatch[1]) : 0;

            if (!results[pkgId]) results[pkgId] = {};
            results[pkgId][label] = powerW;
        }

        for (const domains of Object.values(results)) {
            const total = Object.values(domains).reduce((a, b) => a + b, 0);
            (domains as any)['total'] = Math.round(total * 100) / 100;
        }

        return results;
    }

    async generateTelemetry(): Promise<{ id: number; power: number; temp: number }[]> {
        const temps = await this.getPackageTemps();
        const powerData = await this.getPackagePower();

        const maxPkg = Math.max(temps.length - 1, ...Object.keys(powerData).map(Number), 0);

        const result: {
            id: number;
            totalPower: number;
            power: number;
            temp: number;
        }[] = [];

        for (let pkgId = 0; pkgId <= maxPkg; pkgId++) {
            const entry = powerData[pkgId] ?? {};
            result.push({
                id: pkgId,
                totalPower: 0,
                power: entry.total ?? -1,
                temp: temps[pkgId] ?? -1,
            });
        }

        return result;
    }
}
