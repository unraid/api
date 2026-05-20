import { Injectable, Logger } from '@nestjs/common';
import { constants as fsConstants } from 'node:fs';
import { access, readdir, readFile } from 'node:fs/promises';
import { join } from 'path';

@Injectable()
export class CpuTopologyService {
    private readonly logger = new Logger(CpuTopologyService.name);

    // -----------------------------------------------------------------
    // Read static CPU topology, per-package core thread pairs
    // -----------------------------------------------------------------
    async generateTopology(): Promise<number[][][]> {
        const packages: Record<number, number[][]> = {};
        let cpuDirs: string[];

        try {
            cpuDirs = await readdir('/sys/devices/system/cpu');
        } catch (err) {
            this.logger.warn('CPU topology unavailable, /sys/devices/system/cpu not accessible');
            return [];
        }

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
                this.logger.warn(err, `Topology read error for ${dir}`);
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
                        const packageTemps: number[] = [];
                        const packageTdieTemps: number[] = [];
                        const packageTctlTemps: number[] = [];
                        const coreTemps: number[] = [];

                        for (const f of files) {
                            if (!(f.startsWith('temp') && f.endsWith('_input'))) continue;

                            const inputFile = join(path, f);
                            const labelFile = join(path, f.replace('_input', '_label'));

                            try {
                                const raw = await readFile(inputFile, 'utf8');
                                const parsed = parseInt(raw.trim(), 10);

                                if (!Number.isFinite(parsed)) {
                                    this.logger.warn(`Invalid temperature value: ${raw.trim()}`);
                                    continue;
                                }

                                const tempC = parsed / 1000;
                                let sensorLabel = '';

                                try {
                                    sensorLabel = (await readFile(labelFile, 'utf8'))
                                        .trim()
                                        .toLowerCase();
                                } catch {
                                    // label file is optional
                                }

                                if (
                                    sensorLabel.includes('package id') ||
                                    sensorLabel.includes('cpu temp')
                                ) {
                                    packageTemps.push(tempC);
                                } else if (!sensorLabel && /^temp1_input$/i.test(f) && /k10temp/i.test(label)) {
                                    packageTemps.push(tempC);
                                }

                                if (sensorLabel.includes('tdie')) {
                                    packageTdieTemps.push(tempC);
                                } else if (sensorLabel.includes('tctl')) {
                                    packageTctlTemps.push(tempC);
                                } else if (/^core\s+\d+$/i.test(sensorLabel)) {
                                    coreTemps.push(tempC);
                                }
                            } catch (err) {
                                this.logger.warn('Failed to read file', err);
                            }
                        }

                        if (packageTdieTemps.length > 0) {
                            temps.push(Math.max(...packageTdieTemps));
                        } else if (packageTctlTemps.length > 0) {
                            temps.push(Math.max(...packageTctlTemps));
                        } else if (packageTemps.length > 0) {
                            temps.push(Math.max(...packageTemps));
                        } else if (coreTemps.length > 0) {
                            // Legacy CPUs may expose only per-core readings. Use the hottest core as package temp.
                            temps.push(Math.max(...coreTemps));
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
            return this.getPackagePowerFromHwmon();
        }

        if (!raplPaths.length) return this.getPackagePowerFromHwmon();

        const readEnergy = async (p: string): Promise<number | null> => {
            try {
                await access(join(p, 'energy_uj'), fsConstants.R_OK);
                const raw = await readFile(join(p, 'energy_uj'), 'utf8');
                const parsed = parseInt(raw.trim(), 10);
                return Number.isFinite(parsed) ? parsed : null;
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

            if (!Number.isFinite(diffE) || !Number.isFinite(diffT)) {
                this.logger.warn(`Non-finite energy/time diff for ${p}`);
                continue;
            }

            if (diffT <= 0 || diffE < 0) continue;

            const watts = (diffE * 1e-6) / (diffT * 1e-9);
            const powerW = Math.round(watts * 100) / 100;

            if (!Number.isFinite(powerW)) {
                this.logger.warn(`Non-finite power value for ${p}: ${watts}`);
                continue;
            }

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
            domains['total'] = Math.round(total * 100) / 100;
        }

        if (!Object.keys(results).length) {
            return this.getPackagePowerFromHwmon();
        }

        return results;
    }

    private async getPackagePowerFromHwmon(): Promise<Record<number, Record<string, number>>> {
        const results: Record<number, Record<string, number>> = {};
        let nextFallbackPackageIndex = 0;

        try {
            const hwmons = await readdir('/sys/class/hwmon');
            for (const hwmon of hwmons) {
                const path = join('/sys/class/hwmon', hwmon);
                let chipName = '';

                try {
                    chipName = (await readFile(join(path, 'name'), 'utf8')).trim();
                } catch {
                    continue;
                }

                if (!/fam15h_power|zenpower|amd_energy|rapl/i.test(chipName)) {
                    continue;
                }

                const files = await readdir(path);
                let packageIndex = Number.NaN;

                const chipPackageMatch = chipName.match(/package[-_\s:]?(\d+)/i);
                if (chipPackageMatch) {
                    packageIndex = Number(chipPackageMatch[1]);
                }

                if (!Number.isFinite(packageIndex)) {
                    for (const fileName of files) {
                        if (!fileName.endsWith('_label')) continue;

                        try {
                            const labelValue = (await readFile(join(path, fileName), 'utf8'))
                                .trim()
                                .toLowerCase();
                            const labelPackageMatch = labelValue.match(/package[-_\s:]?(\d+)/i);

                            if (labelPackageMatch) {
                                packageIndex = Number(labelPackageMatch[1]);
                                break;
                            }
                        } catch {
                            // label file is optional
                        }
                    }
                }

                if (!Number.isFinite(packageIndex)) {
                    packageIndex = nextFallbackPackageIndex;
                    nextFallbackPackageIndex += 1;
                } else {
                    nextFallbackPackageIndex = Math.max(nextFallbackPackageIndex, packageIndex + 1);
                }

                for (const f of files) {
                    if (!(f.startsWith('power') && f.endsWith('_input'))) continue;

                    try {
                        const raw = await readFile(join(path, f), 'utf8');
                        const parsed = Number(raw.trim());
                        if (!Number.isFinite(parsed) || parsed < 0) continue;

                        const watts = parsed > 1000 ? parsed / 1_000_000 : parsed;
                        const rounded = Math.round(watts * 100) / 100;

                        if (!Number.isFinite(rounded)) continue;

                        if (!results[packageIndex]) results[packageIndex] = {};
                        results[packageIndex][`${chipName}:${f}`] = rounded;
                    } catch (err) {
                        this.logger.warn('Failed to read file', err);
                    }
                }
            }
        } catch {
            return {};
        }

        for (const domains of Object.values(results)) {
            const total = Object.values(domains).reduce((a, b) => a + b, 0);
            domains['total'] = Math.round(total * 100) / 100;
        }

        return results;
    }

    async generateTelemetry(): Promise<{ id: number; power: number; temp: number }[]> {
        const temps = await this.getPackageTemps();
        const powerData = await this.getPackagePower();

        const maxPkg = Math.max(temps.length - 1, ...Object.keys(powerData).map(Number), 0);

        const result: {
            id: number;
            power: number;
            temp: number;
        }[] = [];

        for (let pkgId = 0; pkgId <= maxPkg; pkgId++) {
            const entry = powerData[pkgId] ?? {};
            result.push({
                id: pkgId,
                power: entry.total ?? -1,
                temp: temps[pkgId] ?? -1,
            });
        }

        return result;
    }
}
