import { Injectable, Logger } from '@nestjs/common';
import { constants as fsConstants } from 'node:fs';
import { access, readdir, readFile } from 'node:fs/promises';
import { basename, join } from 'path';

import { CpuPower } from '@app/unraid-api/graph/resolvers/info/cpu/cpu.model.js';

@Injectable()
export class CpuPowerService {
    private readonly logger = new Logger(CpuPowerService.name);
    async generateCpuPower(): Promise<CpuPower> {
        const id = 'info/cpu-power';
        try {
            const powercapDir = '/sys/class/powercap';
            const prefixes = ['intel-rapl', 'intel-rapl-mmio', 'amd-rapl'];

            const dirEntries = await readdir(powercapDir, { withFileTypes: true }).catch(() => []);
            const raplDomains = dirEntries
                .filter((d) => prefixes.some((p) => d.name.startsWith(`${p}:`)))
                .map((d) => join(powercapDir, d.name));

            if (!raplDomains.length) {
                this.logger.warn(`No RAPL domains found: ${JSON.stringify(dirEntries, null, 2)}`);
                return { id };
            }
            this.logger.debug(JSON.stringify(raplDomains, null, 2));

            const prevEnergy = new Map<string, number>();
            const prevTime = new Map<string, bigint>();

            for (const domainPath of raplDomains) {
                const energyFile = join(domainPath, 'energy_uj');
                try {
                    await access(energyFile, fsConstants.R_OK);
                    const content = await readFile(energyFile, 'utf8');
                    const energy = Number.parseInt(content.trim(), 10);
                    if (!Number.isNaN(energy)) {
                        prevEnergy.set(domainPath, energy);
                        prevTime.set(domainPath, process.hrtime.bigint());
                    }
                } catch {
                    // ignore unreadable files
                }
            }

            // ~200ms delay to measure energy delta
            await new Promise((resolve) => setTimeout(resolve, 200));

            const packages = new Map<number, Record<string, number>>();

            for (const domainPath of raplDomains) {
                const energyFile = join(domainPath, 'energy_uj');
                const nameFile = join(domainPath, 'name');

                try {
                    await access(energyFile, fsConstants.R_OK);
                    await access(nameFile, fsConstants.R_OK);
                } catch {
                    continue;
                }

                const label = (await readFile(nameFile, 'utf8')).trim();
                const nowStr = await readFile(energyFile, 'utf8');
                const now = Number.parseInt(nowStr.trim(), 10);
                const tNow = process.hrtime.bigint();

                const prevE = prevEnergy.get(domainPath);
                const prevT = prevTime.get(domainPath);
                if (prevE === undefined || prevT === undefined) continue;

                const diffEnergy = now - prevE; // microjoules
                const diffTimeNs = Number(tNow - prevT); // nanoseconds
                if (!(diffTimeNs > 0)) continue;

                let powerW = (diffEnergy * 1e-6) / (diffTimeNs * 1e-9);
                if (!Number.isFinite(powerW) || powerW < 0) continue;
                powerW = Math.round(powerW * 100) / 100;

                let pkgId = 0;
                const m1 = label.match(/^package-(\d+)$/);
                if (m1) {
                    pkgId = Number(m1[1]);
                } else {
                    const base = basename(domainPath);
                    const m2 = base.match(/:(\d+)/);
                    if (m2) {
                        pkgId = Number(m2[1]);
                    } else {
                        const m3 = domainPath.match(/:(\d+)(?:\/|$)/);
                        if (m3) pkgId = Number(m3[1]);
                    }
                }

                if (!packages.has(pkgId)) packages.set(pkgId, {});
                const pkg = packages.get(pkgId)!;
                if (/^package-\d+$/.test(label)) {
                    pkg['package'] = powerW;
                } else {
                    pkg[label] = powerW;
                }
            }

            if (!packages.size) {
                return { id };
            }

            let total = 0;
            const sortedPkgIds = [...packages.keys()].sort((a, b) => a - b);
            const coresPower: number[] = [];

            for (const pkgId of sortedPkgIds) {
                const pkg = packages.get(pkgId)!;
                if (pkg['package'] === undefined) {
                    const sum = Object.values(pkg)
                        .filter((v) => typeof v === 'number' && Number.isFinite(v))
                        .reduce((a, b) => a + b, 0);
                    if (sum > 0) {
                        pkg['package'] = Math.round(sum * 100) / 100;
                    }
                }
                if (pkg['package'] !== undefined) {
                    total += pkg['package'];
                    coresPower.push(pkg['package']);
                }
            }

            const result: CpuPower = { id, coresPower: coresPower.length ? coresPower : undefined };
            if (sortedPkgIds.length > 0 && total > 0) {
                result.totalPower = Math.round(total * 100) / 100;
            }
            return result;
        } catch {
            return { id };
        }
    }
}
