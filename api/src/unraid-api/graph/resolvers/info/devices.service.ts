import { Injectable } from '@nestjs/common';
import { access } from 'fs/promises';

import { execa } from 'execa';
import { isSymlink } from 'path-type';

import type { PciDevice } from '@app/core/types/index.js';
import { sanitizeProduct } from '@app/core/utils/vms/domain/sanitize-product.js';
import { sanitizeVendor } from '@app/core/utils/vms/domain/sanitize-vendor.js';
import { vmRegExps } from '@app/core/utils/vms/domain/vm-regexps.js';
import { filterDevices } from '@app/core/utils/vms/filter-devices.js';
import { getPciDevices } from '@app/core/utils/vms/get-pci-devices.js';
import { getters } from '@app/store/index.js';
import { Gpu, Pci, Usb } from '@app/unraid-api/graph/resolvers/info/info.model.js';

@Injectable()
export class DevicesService {
    async generateGpu(): Promise<Gpu[]> {
        try {
            const systemPciDevices = await this.getSystemPciDevices();
            return systemPciDevices
                .filter((device) => device.class === 'vga' && !device.allowed)
                .map((entry) => {
                    const gpu: Gpu = {
                        id: `gpu/${entry.id}`,
                        blacklisted: entry.allowed,
                        class: entry.class,
                        productid: entry.product,
                        typeid: entry.typeid,
                        type: entry.manufacturer,
                        vendorname: entry.vendorname,
                    };
                    return gpu;
                });
        } catch {
            return [];
        }
    }

    async generatePci(): Promise<Pci[]> {
        try {
            const devices = await this.getSystemPciDevices();
            return devices.map((device) => ({
                id: `pci/${device.id}`,
                type: device.manufacturer,
                typeid: device.typeid,
                vendorname: device.vendorname,
                vendorid: device.typeid.substring(0, 4), // Extract vendor ID from type ID
                productname: device.productname,
                productid: device.product,
                blacklisted: device.allowed ? 'true' : 'false',
                class: device.class,
            }));
        } catch {
            return [];
        }
    }

    async generateUsb(): Promise<Usb[]> {
        try {
            const usbDevices = await this.getSystemUSBDevices();
            return usbDevices.map((device) => ({
                id: `usb/${device.id}`,
                name: device.name,
            }));
        } catch {
            return [];
        }
    }

    private addDeviceClass(device: Readonly<PciDevice>): PciDevice {
        const modifiedDevice: PciDevice = {
            ...device,
            class: 'other',
        };

        if (vmRegExps.allowedGpuClassId.test(device.typeid)) {
            modifiedDevice.class = 'vga';
            const regex = new RegExp(/.+\[(?<gpuName>.+)]/);
            const productName = regex.exec(device.productname)?.groups?.gpuName;

            if (productName) {
                modifiedDevice.productname = productName;
            }

            return modifiedDevice;
        }

        if (vmRegExps.allowedAudioClassId.test(device.typeid)) {
            modifiedDevice.class = 'audio';
            return modifiedDevice;
        }

        return modifiedDevice;
    }

    private async getSystemPciDevices(): Promise<PciDevice[]> {
        const devices = await getPciDevices();
        const basePath = '/sys/bus/pci/devices/0000:';

        const filteredDevices = await Promise.all(
            devices.map(async (device: Readonly<PciDevice>) => {
                const exists = await access(`${basePath}${device.id}/iommu_group/`)
                    .then(() => true)
                    .catch(() => false);
                return exists ? device : null;
            })
        ).then((devices) => devices.filter((device) => device !== null));

        const processedDevices = await filterDevices(filteredDevices).then(async (devices) =>
            Promise.all(
                devices
                    .map((device) => this.addDeviceClass(device as PciDevice))
                    .map(async (device) => {
                        await isSymlink(`${basePath}${device.id}/driver`).then((symlink) => {
                            if (symlink) {
                                // Future: Add driver detection logic here
                            }
                        });

                        device.vendorname = sanitizeVendor(device.vendorname);
                        device.productname = sanitizeProduct(device.productname);

                        return device;
                    })
            )
        );

        return processedDevices;
    }

    private async getSystemUSBDevices(): Promise<PciDevice[]> {
        const usbHubs = await execa('cat /sys/bus/usb/drivers/hub/*/modalias', { shell: true })
            .then(({ stdout }) =>
                stdout.split('\n').map((line) => {
                    const [, id] = line.match(/usb:v(\w{9})/) ?? [];
                    return id.replace('p', ':');
                })
            )
            .catch(() => [] as string[]);

        const emhttp = getters.emhttp();

        const filterBootDrive = (device: Readonly<PciDevice>): boolean =>
            emhttp.var.flashGuid !== device.guid;

        const filterUsbHubs = (device: Readonly<PciDevice>): boolean => !usbHubs.includes(device.id);

        const sanitizeVendorName = (device: Readonly<PciDevice>) => {
            const vendorname = sanitizeVendor(device.vendorname || '');
            return {
                ...device,
                vendorname,
            };
        };

        const parseBasicDevice = async (device: PciDevice): Promise<PciDevice> => {
            const modifiedDevice: PciDevice = {
                ...device,
            };

            const idParts = device.id.split(':');
            if (idParts.length === 2) {
                const [vendorId, productId] = idParts;
                modifiedDevice.guid = `${vendorId}-${productId}-basic`;
            } else {
                modifiedDevice.guid = `unknown-${Math.random().toString(36).substring(7)}`;
            }

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

                    const name = result.groups.n?.trim() || '';
                    return {
                        ...result.groups,
                        name,
                    } as unknown as PciDevice;
                })
                .filter((device): device is PciDevice => device !== null) ?? [];

        const usbDevices = await execa('lsusb')
            .then(async ({ stdout }) => {
                const devices = parseUsbDevices(stdout);
                const processedDevices = await Promise.all(devices.map(parseBasicDevice));
                return processedDevices
                    .filter(filterBootDrive)
                    .filter(filterUsbHubs)
                    .map(sanitizeVendorName);
            })
            .catch(() => []);

        return usbDevices;
    }
}
