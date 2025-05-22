import { access } from 'fs/promises';

import toBytes from 'bytes';
import { execa, execaCommandSync } from 'execa';
import { isSymlink } from 'path-type';
import { cpu, cpuFlags, mem, memLayout, osInfo, versions } from 'systeminformation';

import type { PciDevice } from '@app/core/types/index.js';
import { bootTimestamp } from '@app/common/dashboard/boot-timestamp.js';
import { getUnraidVersion } from '@app/common/dashboard/get-unraid-version.js';
import { AppError } from '@app/core/errors/app-error.js';
import { type DynamixConfig } from '@app/core/types/ini.js';
import { toBoolean } from '@app/core/utils/casting.js';
import { docker } from '@app/core/utils/clients/docker.js';
import { cleanStdout } from '@app/core/utils/misc/clean-stdout.js';
import { loadState } from '@app/core/utils/misc/load-state.js';
import { sanitizeProduct } from '@app/core/utils/vms/domain/sanitize-product.js';
import { sanitizeVendor } from '@app/core/utils/vms/domain/sanitize-vendor.js';
import { vmRegExps } from '@app/core/utils/vms/domain/vm-regexps.js';
import { filterDevices } from '@app/core/utils/vms/filter-devices.js';
import { getPciDevices } from '@app/core/utils/vms/get-pci-devices.js';
import { getters } from '@app/store/index.js';
import { ThemeName } from '@app/unraid-api/graph/resolvers/customization/theme.model.js';
import {
    Devices,
    Display,
    Gpu,
    InfoApps,
    InfoCpu,
    InfoMemory,
    Os as InfoOs,
    MemoryLayout,
    Temperature,
    Versions,
} from '@app/unraid-api/graph/resolvers/info/info.model.js';

export const generateApps = async (): Promise<InfoApps> => {
    const installed = await docker
        .listContainers({ all: true })
        .catch(() => [])
        .then((containers) => containers.length);
    const started = await docker
        .listContainers()
        .catch(() => [])
        .then((containers) => containers.length);
    return { id: 'info/apps', installed, started };
};

export const generateOs = async (): Promise<InfoOs> => {
    const os = await osInfo();

    return {
        id: 'info/os',
        ...os,
        hostname: getters.emhttp().var.name,
        uptime: bootTimestamp.toISOString(),
    };
};

export const generateCpu = async (): Promise<InfoCpu> => {
    const { cores, physicalCores, speedMin, speedMax, stepping, ...rest } = await cpu();
    const flags = await cpuFlags()
        .then((flags) => flags.split(' '))
        .catch(() => []);

    return {
        id: 'info/cpu',
        ...rest,
        cores: physicalCores,
        threads: cores,
        flags,
        stepping: Number(stepping),
        // @TODO Find out what these should be if they're not defined
        speedmin: speedMin || -1,
        speedmax: speedMax || -1,
    };
};

export const generateDisplay = async (): Promise<Display> => {
    const filePaths = getters.paths()['dynamix-config'];

    const state = filePaths.reduce<Partial<DynamixConfig>>(
        (acc, filePath) => {
            const state = loadState<DynamixConfig>(filePath);
            return state ? { ...acc, ...state } : acc;
        },
        {
            id: 'dynamix-config/display',
        }
    );

    if (!state.display) {
        return {
            id: 'dynamix-config/display',
        };
    }
    const { theme, unit, ...display } = state.display;
    return {
        id: 'dynamix-config/display',
        ...display,
        theme: theme as ThemeName,
        unit: unit as Temperature,
        scale: toBoolean(display.scale),
        tabs: toBoolean(display.tabs),
        resize: toBoolean(display.resize),
        wwn: toBoolean(display.wwn),
        total: toBoolean(display.total),
        usage: toBoolean(display.usage),
        text: toBoolean(display.text),
        warning: Number.parseInt(display.warning, 10),
        critical: Number.parseInt(display.critical, 10),
        hot: Number.parseInt(display.hot, 10),
        max: Number.parseInt(display.max, 10),
        locale: display.locale || 'en_US',
    };
};

export const generateVersions = async (): Promise<Versions> => {
    const unraid = await getUnraidVersion();
    const softwareVersions = await versions();

    return {
        id: 'info/versions',
        unraid,
        ...softwareVersions,
    };
};

export const generateMemory = async (): Promise<InfoMemory> => {
    const layout = await memLayout()
        .then((dims) => dims.map((dim) => dim as MemoryLayout))
        .catch(() => []);
    const info = await mem();
    let max = info.total;

    // Max memory
    try {
        const memoryInfo = await execa('dmidecode', ['-t', 'memory'])
            .then(cleanStdout)
            .catch((error: NodeJS.ErrnoException) => {
                if (error.code === 'ENOENT') {
                    throw new AppError('The dmidecode cli utility is missing.');
                }

                throw error;
            });
        const lines = memoryInfo.split('\n');
        const header = lines.find((line) => line.startsWith('Physical Memory Array'));
        if (header) {
            const start = lines.indexOf(header);
            const nextHeaders = lines.slice(start, -1).find((line) => line.startsWith('Handle '));

            if (nextHeaders) {
                const end = lines.indexOf(nextHeaders);
                const fields = lines.slice(start, end);

                max =
                    toBytes(
                        fields
                            ?.find((line) => line.trim().startsWith('Maximum Capacity'))
                            ?.trim()
                            ?.split(': ')[1] ?? '0'
                    ) ?? 0;
            }
        }
    } catch {
        // Ignore errors here
    }

    return {
        id: 'info/memory',
        layout,
        max,
        ...info,
    };
};

export const generateDevices = async (): Promise<Devices> => {
    /**
     * Set device class to device.
     * @param device The device to modify.
     * @returns The same device passed in but with the class modified.
     */
    const addDeviceClass = (device: Readonly<PciDevice>): PciDevice => {
        const modifiedDevice: PciDevice = {
            ...device,
            class: 'other',
        };

        // GPU
        if (vmRegExps.allowedGpuClassId.test(device.typeid)) {
            modifiedDevice.class = 'vga';
            // Specialized product name cleanup for GPU
            // GF116 [GeForce GTX 550 Ti] --> GeForce GTX 550 Ti
            const regex = new RegExp(/.+\[(?<gpuName>.+)]/);
            const productName = regex.exec(device.productname)?.groups?.gpuName;

            if (productName) {
                modifiedDevice.productname = productName;
            }

            return modifiedDevice;
            // Audio
        }

        if (vmRegExps.allowedAudioClassId.test(device.typeid)) {
            modifiedDevice.class = 'audio';

            return modifiedDevice;
        }

        return modifiedDevice;
    };

    /**
     * System PCI devices.
     */
    const systemPciDevices = async (): Promise<PciDevice[]> => {
        const devices = await getPciDevices();
        const basePath = '/sys/bus/pci/devices/0000:';

        // Remove devices with no IOMMU support
        const filteredDevices = await Promise.all(
            devices.map(async (device: Readonly<PciDevice>) => {
                const exists = await access(`${basePath}${device.id}/iommu_group/`)
                    .then(() => true)
                    .catch(() => false);
                return exists ? device : null;
            })
        ).then((devices) => devices.filter((device) => device !== null));

        /**
         * Run device cleanup
         *
         * Tasks:
         * - Mark disallowed devices
         * - Add class
         * - Add whether kernel-bound driver exists
         * - Cleanup device vendor/product names
         */
        const processedDevices = await filterDevices(filteredDevices).then(async (devices) =>
            Promise.all(
                devices
                    .map((device) => addDeviceClass(device as PciDevice))
                    .map(async (device) => {
                        // Attempt to get the current kernel-bound driver for this pci device
                        await isSymlink(`${basePath}${device.id}/driver`).then((symlink) => {
                            if (symlink) {
                                // $strLink = @readlink('/sys/bus/pci/devices/0000:'.$arrMatch['id']. '/driver');
                                // if (!empty($strLink)) {
                                // 	$strDriver = basename($strLink);
                                // }
                            }
                        });

                        // Clean up the vendor and product name
                        device.vendorname = sanitizeVendor(device.vendorname);
                        device.productname = sanitizeProduct(device.productname);

                        return device;
                    })
            )
        );

        return processedDevices;
    };

    /**
     * System GPU Devices
     *
     * @name systemGPUDevices
     * @ignore
     * @private
     */
    const systemGPUDevices: Promise<Gpu[]> = systemPciDevices()
        .then((devices) => {
            return devices
                .filter((device) => device.class === 'vga' && !device.allowed)
                .map((entry) => {
                    const gpu: Gpu = {
                        blacklisted: entry.allowed,
                        class: entry.class,
                        id: entry.id,
                        productid: entry.product,
                        typeid: entry.typeid,
                        type: entry.manufacturer,
                        vendorname: entry.vendorname,
                    };
                    return gpu;
                });
        })
        .catch(() => []);

    /**
     * System usb devices.
     * @returns Array of USB devices.
     */
    const getSystemUSBDevices = async () => {
        try {
            // Get a list of all usb hubs so we can filter the allowed/disallowed
            const usbHubs = await execa('cat /sys/bus/usb/drivers/hub/*/modalias', { shell: true })
                .then(({ stdout }) =>
                    stdout.split('\n').map((line) => {
                        const [, id] = line.match(/usb:v(\w{9})/) ?? [];
                        return id.replace('p', ':');
                    })
                )
                .catch(() => [] as string[]);

            const emhttp = getters.emhttp();

            // Remove boot drive
            const filterBootDrive = (device: Readonly<PciDevice>): boolean =>
                emhttp.var.flashGuid !== device.guid;

            // Remove usb hubs
            const filterUsbHubs = (device: Readonly<PciDevice>): boolean => !usbHubs.includes(device.id);

            // Clean up the name
            const sanitizeVendorName = (device: Readonly<PciDevice>) => {
                const vendorname = sanitizeVendor(device.vendorname || '');
                return {
                    ...device,
                    vendorname,
                };
            };

            // Simplified basic device parsing without verbose details
            const parseBasicDevice = async (device: PciDevice): Promise<PciDevice> => {
                const modifiedDevice: PciDevice = {
                    ...device,
                };

                // Use a simplified GUID generation instead of calling lsusb -v
                const idParts = device.id.split(':');
                if (idParts.length === 2) {
                    const [vendorId, productId] = idParts;
                    modifiedDevice.guid = `${vendorId}-${productId}-basic`;
                } else {
                    modifiedDevice.guid = `unknown-${Math.random().toString(36).substring(7)}`;
                }

                // Use the name from basic lsusb output
                const deviceName = device.name?.trim() || '';
                modifiedDevice.name = deviceName || '[unnamed device]';

                return modifiedDevice;
            };

            const parseUsbDevices = (stdout: string): PciDevice[] =>
                stdout
                    .split('\n')
                    .map((line) => {
                        const regex = new RegExp(/^.+: ID (?<id>\S+)(?<n>.*)$/);
                        const result = regex.exec(line);
                        if (!result?.groups) return null;

                        // Extract name from the line if available
                        const name = result.groups.n?.trim() || '';
                        return {
                            ...result.groups,
                            name,
                        } as unknown as PciDevice;
                    })
                    .filter((device): device is PciDevice => device !== null) ?? [];

            // Get all usb devices with basic listing only
            const usbDevices = await execa('lsusb')
                .then(async ({ stdout }) => {
                    const devices = parseUsbDevices(stdout);
                    // Process devices in parallel
                    const processedDevices = await Promise.all(devices.map(parseBasicDevice));
                    return processedDevices
                        .filter(filterBootDrive)
                        .filter(filterUsbHubs)
                        .map(sanitizeVendorName);
                })
                .catch(() => []);

            return usbDevices;
        } catch (error: unknown) {
            return [];
        }
    };

    return {
        id: 'info/devices',
        // Scsi: await scsiDevices,
        gpu: await systemGPUDevices,
        pci: await systemPciDevices(),
        usb: await getSystemUSBDevices(),
    };
};
