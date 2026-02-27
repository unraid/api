import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ArrayDiskType } from '@app/unraid-api/graph/resolvers/array/array.model.js';
import {
    OnboardingInternalBootContext,
    OnboardingInternalBootDeviceOption,
} from '@app/unraid-api/graph/resolvers/onboarding/onboarding-internal-boot.model.js';

type EmhttpVarRecord = {
    fsState?: unknown;
    bootEligible?: unknown;
    reservedNames?: unknown;
};

type EmhttpDiskRecord = {
    type?: unknown;
    name?: unknown;
};

type EmhttpShareRecord = {
    name?: unknown;
};

type EmhttpDeviceRecord = {
    id?: unknown;
    device?: unknown;
    sectors?: unknown;
    sector_size?: unknown;
};

type ParsedDevice = {
    option: OnboardingInternalBootDeviceOption;
    sectors: number;
    model: string;
    device: string;
};

const BOOT_POOL_MAX_SLOTS = 2;
const DEFAULT_BOOT_SIZE_MIB = 16384;
const BOOT_SIZE_PRESETS_MIB = [16384, 32768, 65536, 131072];

const trimString = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

const parsePositiveNumber = (value: unknown): number => {
    if (typeof value === 'number' && Number.isFinite(value) && value > 0) {
        return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
        const parsed = Number(value);
        if (Number.isFinite(parsed) && parsed > 0) {
            return parsed;
        }
    }
    return 0;
};

const formatBytes = (bytes: number): string => {
    if (!Number.isFinite(bytes) || bytes <= 0) {
        return '';
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    let value = bytes;
    let unitIndex = 0;

    while (value >= 1024 && unitIndex < units.length - 1) {
        value /= 1024;
        unitIndex += 1;
    }

    const precision = value >= 100 || unitIndex === 0 ? 0 : 1;
    return `${value.toFixed(precision)} ${units[unitIndex]}`;
};

const getModel = (id: string): string => {
    const position = id.lastIndexOf('_');
    return position === -1 ? id : id.slice(0, position);
};

const normalizePoolName = (name: string): string => name.replace(/\d+$/, '');

@Injectable()
export class OnboardingInternalBootService {
    constructor(private readonly configService: ConfigService) {}

    private getReservedNames(varState: EmhttpVarRecord): string[] {
        const rawReserved = trimString(varState.reservedNames);
        if (!rawReserved) {
            return [];
        }
        return rawReserved
            .split(',')
            .map((entry) => entry.trim())
            .filter((entry) => entry.length > 0);
    }

    private getShareNames(): string[] {
        const shares = this.configService.get<EmhttpShareRecord[]>('store.emhttp.shares', []);
        const names: string[] = [];
        const seen = new Set<string>();

        for (const share of shares) {
            const name = trimString(share?.name);
            if (!name || seen.has(name)) {
                continue;
            }
            seen.add(name);
            names.push(name);
        }

        return names;
    }

    private getPoolNames(): string[] {
        const disks = this.configService.get<EmhttpDiskRecord[]>('store.emhttp.disks', []);
        const names: string[] = [];
        const seen = new Set<string>();

        for (const disk of disks) {
            if (disk?.type !== ArrayDiskType.CACHE) {
                continue;
            }
            const poolName = normalizePoolName(trimString(disk.name));
            if (!poolName || seen.has(poolName)) {
                continue;
            }
            seen.add(poolName);
            names.push(poolName);
        }

        return names;
    }

    private parseDevices(): OnboardingInternalBootDeviceOption[] {
        const devices = this.configService.get<EmhttpDeviceRecord[]>('store.emhttp.devices', []);
        const parsed: ParsedDevice[] = [];

        for (const item of devices) {
            const id = trimString(item?.id);
            const device = trimString(item?.device);
            const sectors = parsePositiveNumber(item?.sectors);
            const sectorSize = parsePositiveNumber(item?.sector_size);
            const sizeBytes = sectors > 0 && sectorSize > 0 ? sectors * sectorSize : 0;
            const sizeMiB = sizeBytes > 0 ? Math.floor(sizeBytes / 1024 / 1024) : 0;
            const value = id || device;

            if (!value) {
                continue;
            }

            const sizeText = formatBytes(sizeBytes);
            const labelStart = sizeText ? `${value} - ${sizeText}` : value;
            const label = device ? `${labelStart} (${device})` : labelStart;

            parsed.push({
                option: {
                    value,
                    label,
                    sizeMiB,
                },
                sectors,
                model: getModel(id),
                device,
            });
        }

        parsed.sort((left, right) => {
            if (left.sectors !== right.sectors) {
                return right.sectors - left.sectors;
            }

            const modelCompare = left.model.localeCompare(right.model, undefined, {
                sensitivity: 'base',
                numeric: true,
            });
            if (modelCompare !== 0) {
                return modelCompare;
            }

            return left.device.localeCompare(right.device);
        });

        return parsed.map((entry) => entry.option);
    }

    getContext(): OnboardingInternalBootContext {
        const varState = this.configService.get<EmhttpVarRecord>('store.emhttp.var', {});
        const poolNames = this.getPoolNames();

        return {
            fsState: trimString(varState.fsState) || null,
            bootEligible: Boolean(varState.bootEligible),
            reservedNames: this.getReservedNames(varState),
            shareNames: this.getShareNames(),
            poolNames,
            defaultPoolName: poolNames.length === 0 ? 'cache' : '',
            maxSlots: BOOT_POOL_MAX_SLOTS,
            bootSizePresetsMiB: BOOT_SIZE_PRESETS_MIB,
            defaultBootSizeMiB: DEFAULT_BOOT_SIZE_MIB,
            deviceOptions: this.parseDevices(),
        };
    }
}
