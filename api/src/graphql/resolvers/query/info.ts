import {
    baseboard,
    cpu,
    cpuFlags,
    mem,
    memLayout,
    osInfo,
    system,
    versions,
} from 'systeminformation';
import { docker } from '@app/core/utils/clients/docker';
import {
    type InfoApps,
    type Os as InfoOs,
    type InfoCpu,
    type Display,
    type Theme,
    type Temperature,
    type Baseboard,
    type Versions,
    type InfoMemory,
    type MemoryLayout,
    type System,
    type Devices,
    type InfoResolvers,
    type Gpu,
} from '@app/graphql/generated/api/types';
import { getters } from '@app/store';
import { loadState } from '@app/core/utils/misc/load-state';
import { type DynamixConfig } from '@app/core/types/ini';
import { toBoolean } from '@app/core/utils/casting';
import toBytes from 'bytes';
import { getUnraidVersion } from '@app/common/dashboard/get-unraid-version';
import { AppError } from '@app/core/errors/app-error';
import { cleanStdout } from '@app/core/utils/misc/clean-stdout';
import { getMachineId } from '@app/core/utils/misc/get-machine-id';
import { execaCommandSync, execa } from 'execa';
import { pathExists } from 'path-exists';
import { filter as asyncFilter } from 'p-iteration';
import { isSymlink } from 'path-type';
import type { PciDevice } from '@app/core/types';
import { vmRegExps } from '@app/core/utils/vms/domain/vm-regexps';
import { getPciDevices } from '@app/core/utils/vms/get-pci-devices';
import { filterDevices } from '@app/core/utils/vms/filter-devices';
import { sanitizeVendor } from '@app/core/utils/vms/domain/sanitize-vendor';
import { sanitizeProduct } from '@app/core/utils/vms/domain/sanitize-product';
import { bootTimestamp } from '@app/common/dashboard/boot-timestamp';

export const generateApps = async (): Promise<InfoApps> => {
    const installed = await docker
        .listContainers({ all: true })
        .catch(() => [])
        .then((containers) => containers.length);
    const started = await docker
        .listContainers()
        .catch(() => [])
        .then((containers) => containers.length);
    return { installed, started };
};

const generateOs = async (): Promise<InfoOs> => {
    const os = await osInfo();

    return {
        ...os,
        uptime: bootTimestamp.toISOString(),
    };
};

const generateCpu = async (): Promise<InfoCpu> => {
    const { cores, physicalCores, speedMin, speedMax, stepping, ...rest } =
        await cpu();
    const flags = await cpuFlags().then((flags) => flags.split(' '));

    return {
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

const generateDisplay = async (): Promise<Display> => {
    const filePath = getters.paths()['dynamix-config'];
    const state = loadState<DynamixConfig>(filePath);
    if (!state) {
        return {};
    }
    const { theme, unit, ...display } = state.display;
    return {
        ...display,
        theme: theme as Theme,
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

const generateBaseboard = async (): Promise<Baseboard> => baseboard();

const generateVersions = async (): Promise<Versions> => {
    const unraid = await getUnraidVersion();
    const softwareVersions = await versions();

    return {
        unraid,
        ...softwareVersions,
    };
};

const generateMemory = async (): Promise<InfoMemory> => {
    const layout = await memLayout().then((dims) =>
        dims.map((dim) => dim as MemoryLayout)
    );
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
        const header = lines.find((line) =>
            line.startsWith('Physical Memory Array')
        );
        if (header) {
            const start = lines.indexOf(header);
            const nextHeaders = lines
                .slice(start, -1)
                .find((line) => line.startsWith('Handle '));

            if (nextHeaders) {
                const end = lines.indexOf(nextHeaders);
                const fields = lines.slice(start, end);

                max = toBytes(
                    fields
                        ?.find((line) =>
                            line.trim().startsWith('Maximum Capacity')
                        )
                        ?.trim()
                        ?.split(': ')[1] ?? '0'
                );
            }
        }
    } catch {
        // Ignore errors here
    }

    return {
        layout,
        max,
        ...info,
    };
};

const generateDevices = async (): Promise<Devices> => {
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
        const filteredDevices = await asyncFilter(
            devices,
            async (device: Readonly<PciDevice>) =>
                pathExists(`${basePath}${device.id}/iommu_group/`)
        );

        /**
         * Run device cleanup
         *
         * Tasks:
         * - Mark disallowed devices
         * - Add class
         * - Add whether kernel-bound driver exists
         * - Cleanup device vendor/product names
         */
        const processedDevices = await filterDevices(filteredDevices).then(
            async (devices) =>
                Promise.all(
                    devices
                        // @ts-expect-error - Device is not PciDevice
                        .map((device) => addDeviceClass(device))
                        .map(async (device) => {
                            // Attempt to get the current kernel-bound driver for this pci device
                            await isSymlink(
                                `${basePath}${device.id}/driver`
                            ).then((symlink) => {
                                if (symlink) {
                                    // $strLink = @readlink('/sys/bus/pci/devices/0000:'.$arrMatch['id']. '/driver');
                                    // if (!empty($strLink)) {
                                    // 	$strDriver = basename($strLink);
                                    // }
                                }
                            });

                            // Clean up the vendor and product name
                            device.vendorname = sanitizeVendor(
                                device.vendorname
                            );
                            device.productname = sanitizeProduct(
                                device.productname
                            );

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
    const systemGPUDevices: Promise<Gpu[]> = systemPciDevices().then(
        (devices) => {
            return devices.filter(
                (device) => device.class === 'vga' && !device.allowed
            ).map(entry => {
                const gpu: Gpu = {
                    blacklisted: entry.allowed,
                    class: entry.class,
                    id: entry.id,
                    productid: entry.product,
                    typeid: entry.typeid,
                    type: entry.manufacturer,
                    vendorname: entry.vendorname
                }
                return gpu;
            });
        }
    ).catch(() => []);

    /**
     * System usb devices.
     * @returns Array of USB devices.
     */
    const getSystemUSBDevices = async () => {
        try {
            // Get a list of all usb hubs so we can filter the allowed/disallowed
            const usbHubs = await execa(
                'cat /sys/bus/usb/drivers/hub/*/modalias',
                { shell: true }
            )
                .then(({ stdout }) =>
                    stdout.split('\n').map((line) => {
                        // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
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
            const filterUsbHubs = (device: Readonly<PciDevice>): boolean =>
                !usbHubs.includes(device.id);

            // Clean up the name
            const sanitizeVendorName = (device: Readonly<PciDevice>) => {
                const vendorname = sanitizeVendor(device.vendorname || '');
                return {
                    ...device,
                    vendorname,
                };
            };

            const parseDeviceLine = (
                line: Readonly<string>
            ): { value: string; string: string } => {
                const emptyLine = { value: '', string: '' };

                // If the line is blank return nothing
                if (!line) {
                    return emptyLine;
                }

                // Parse the line
                const [, _] = line.split(/[ \t]{2,}/).filter(Boolean);
                // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
                const match = _.match(/^(\S+)\s(.*)/)?.slice(1);

                // If there's no match return nothing
                if (!match) {
                    return emptyLine;
                }

                return {
                    value: match[0],
                    string: match[1],
                };
            };

            // Add extra fields to device
            const parseDevice = (device: Readonly<PciDevice>) => {
                const modifiedDevice: PciDevice = {
                    ...device,
                };
                const info = execaCommandSync(
                    `lsusb -d ${device.id} -v`
                ).stdout.split('\n');
                const deviceName = device.name.trim();
                const iSerial = parseDeviceLine(
                    info.filter((line) => line.includes('iSerial'))[0]
                );
                const iProduct = parseDeviceLine(
                    info.filter((line) => line.includes('iProduct'))[0]
                );
                const iManufacturer = parseDeviceLine(
                    info.filter((line) => line.includes('iManufacturer'))[0]
                );
                const idProduct = parseDeviceLine(
                    info.filter((line) => line.includes('idProduct'))[0]
                );
                const idVendor = parseDeviceLine(
                    info.filter((line) => line.includes('idVendor'))[0]
                );
                const serial = `${iSerial.string
                    .slice(8)
                    .slice(0, 4)}-${iSerial.string.slice(8).slice(4)}`;
                const guid = `${idVendor.value.slice(
                    2
                )}-${idProduct.value.slice(2)}-${serial}`;

                modifiedDevice.serial = iSerial.string;
                modifiedDevice.product = iProduct.string;
                modifiedDevice.manufacturer = iManufacturer.string;
                modifiedDevice.guid = guid;

                // Set name if missing
                if (deviceName === '') {
                    modifiedDevice.name =
                        `${iProduct.string} ${iManufacturer.string}`.trim();
                }

                // Name still blank? Replace using fallback default
                if (deviceName === '') {
                    modifiedDevice.name = '[unnamed device]';
                }

                // Ensure name is trimmed
                modifiedDevice.name = device.name.trim();

                return modifiedDevice;
            };

            const parseUsbDevices = (stdout: string) =>
                stdout.split('\n').map((line) => {
                    const regex = new RegExp(/^.+: ID (?<id>\S+)(?<name>.*)$/);
                    const result = regex.exec(line);
                    return result?.groups as unknown as PciDevice;
                }) ?? [];

            // Get all usb devices
            const usbDevices = await execa('lsusb').then(async ({ stdout }) =>
                parseUsbDevices(stdout)
                    .map(parseDevice)
                    .filter(filterBootDrive)
                    .filter(filterUsbHubs)
                    .map(sanitizeVendorName)
            );

            return usbDevices;
        } catch (error: unknown) {
            return [];
        }
    };

    return {
        // Scsi: await scsiDevices,
        gpu: await systemGPUDevices,
        // Move this to interfaces
        // network: await si.networkInterfaces(),
        pci: await systemPciDevices(),
        usb: await getSystemUSBDevices(),
    };
};

const generateMachineId = async (): Promise<string> => getMachineId();

const generateSystem = async (): Promise<System> => system();

export const infoSubResolvers: InfoResolvers = {
    apps: async () => generateApps(),
    baseboard: async () => generateBaseboard(),
    cpu: async () => generateCpu(),
    devices: async () => generateDevices(),
    display: async () => generateDisplay(),
    machineId: async () => generateMachineId(),
    memory: async () => generateMemory(),
    os: async () => generateOs(),
    system: async () => generateSystem(),
    versions: async () => generateVersions(),
};
