/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import pProps from 'p-props';
import execa from 'execa';
import pathExists from 'path-exists';
import { filter as asyncFilter } from 'p-iteration';
import { isSymlink } from 'path-type';
import type { PciDevice, CoreResult, CoreContext } from '@app/core/types';
import { varState } from '@app/core/states/var';
import { vmRegExps } from '@app/core/utils/vms/domain/vm-regexps';
import { getPciDevices } from '@app/core/utils/vms/get-pci-devices';
import { filterDevices } from '@app/core/utils/vms/filter-devices';
import { sanitizeVendor } from '@app/core/utils/vms/domain/sanitize-vendor';
import { sanitizeProduct } from '@app/core/utils/vms/domain/sanitize-product';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';

/**
 * System Network interfaces.
 */
// const systemNetworkInterfaces = si.networkInterfaces();

// System Disk controllers
// const systemDiskControllers = [];
// if (!empty($arrDisk['device']) && file_exists('/dev/'.$arrDisk['device'])) {
// 	$strOSDiskController = trim(exec("udevadm info -q path -n /dev/".$arrDisk['device']." | grep -Po '0000:\K\w{2}:\w{2}\.\w{1}'"));
// }
// $arrOSDiskControllers = array_values(array_unique($arrOSDiskControllers));

// $arrBlacklistIDs = $arrOSDiskControllers;
// if (!empty($strOSNetworkDevice)) {
// 	$arrBlacklistIDs[] = $strOSNetworkDevice;
// }

// $arrValidPCIDevices = [];

/**
 * Set device class to device.
 * @param device The device to modify.
 * @returns The same device passed in but with the class modified.
 */
const addDeviceClass = (device: Readonly<PciDevice>): PciDevice => {
	const modifiedDevice: PciDevice = {
		...device,
		class: 'other'
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
	const filteredDevices = await asyncFilter(devices, async (device: Readonly<PciDevice>) => pathExists(`${basePath}${device.id}/iommu_group/`));

	/**
	 * Run device cleanup
	 *
	 * Tasks:
	 * - Mark disallowed devices
	 * - Add class
	 * - Add whether kernel-bound driver exists
	 * - Cleanup device vendor/product names
	 */
	const processedDevices = await filterDevices(filteredDevices).then(async devices => {
		return Promise.all(devices
			// @ts-expect-error
			.map(addDeviceClass)
			.map(async device => {
				// Attempt to get the current kernel-bound driver for this pci device
				await isSymlink(`${basePath}${device.id}/driver`).then(symlink => {
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
			}));
	});

	return processedDevices;
};

/**
 * System GPU Devices
 *
 * @name systemGPUDevices
 * @ignore
 * @private
 */
const systemGPUDevices = systemPciDevices().then(devices => {
	return devices.filter(device => {
		return device.class === 'vga' && !device.allowed;
	});
});

/**
 * System Audio Devices
 *
 * @name systemAudioDevices
 * @ignore
 * @private
 */
const systemAudioDevices = systemPciDevices().then(devices => {
	return devices.filter(device => device.class === 'audio' && !device.allowed);
});

/**
 * System usb devices.
 * @returns Array of USB devices.
 */
const getSystemUSBDevices = async (): Promise<any[]> => {
	// Get a list of all usb hubs so we can filter the allowed/disallowed
	const usbHubs = await execa('cat /sys/bus/usb/drivers/hub/*/modalias', { shell: true }).then(({ stdout }) => {
		return stdout.split('\n').map(line => {
			// eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
			const [, id] = line.match(/usb:v(\w{9})/)!;
			return id.replace('p', ':');
		});
	}).catch(() => []);

	// Remove boot drive
	const filterBootDrive = (device: Readonly<PciDevice>): boolean => varState?.data?.flashGuid !== device.guid;

	// Remove usb hubs
	// @ts-expect-error
	const filterUsbHubs = (device: Readonly<PciDevice>): boolean => !usbHubs.includes(device.id);

	// Clean up the name
	const sanitizeVendorName = (device: Readonly<PciDevice>) => {
		const vendorname = sanitizeVendor(device.vendorname || '');
		return {
			...device,
			vendorname
		};
	};

	const parseDeviceLine = (line: Readonly<string>): { value: string; string: string } => {
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
			string: match[1]
		};
	};

	// Add extra fields to device
	const parseDevice = (device: Readonly<PciDevice>) => {
		const modifiedDevice: PciDevice = {
			...device
		};
		const info = execa.commandSync(`lsusb -d ${device.id} -v`).stdout.split('\n');
		const deviceName = device.name.trim();
		const iSerial = parseDeviceLine(info.filter(line => line.includes('iSerial'))[0]);
		const iProduct = parseDeviceLine(info.filter(line => line.includes('iProduct'))[0]);
		const iManufacturer = parseDeviceLine(info.filter(line => line.includes('iManufacturer'))[0]);
		const idProduct = parseDeviceLine(info.filter(line => line.includes('idProduct'))[0]);
		const idVendor = parseDeviceLine(info.filter(line => line.includes('idVendor'))[0]);
		const serial = `${iSerial.string.slice(8).slice(0, 4)}-${iSerial.string.slice(8).slice(4)}`;
		const guid = `${idVendor.value.slice(2)}-${idProduct.value.slice(2)}-${serial}`;

		modifiedDevice.serial = iSerial.string;
		modifiedDevice.product = iProduct.string;
		modifiedDevice.manufacturer = iManufacturer.string;
		modifiedDevice.guid = guid;

		// Set name if missing
		if (deviceName === '') {
			modifiedDevice.name = `${iProduct.string} ${iManufacturer.string}`.trim();
		}

		// Name still blank? Replace using fallback default
		if (deviceName === '') {
			modifiedDevice.name = '[unnamed device]';
		}

		// Ensure name is trimmed
		modifiedDevice.name = device.name.trim();

		return modifiedDevice;
	};

	const parseUsbDevices = (stdout: string) => stdout.split('\n').map(line => {
		const regex = new RegExp(/^.+: ID (?<id>\S+)(?<name>.*)$/);
		const result = regex.exec(line);
		return (result!.groups as unknown as PciDevice);
	}) || [];

	// Get all usb devices
	const usbDevices = await execa('lsusb').then(async ({ stdout }) => {
		return parseUsbDevices(stdout)
			.map(parseDevice)
			.filter(filterBootDrive)
			.filter(filterUsbHubs)
			.map(sanitizeVendorName);
	});

	return usbDevices;
};

/**
 * Get device info.
 */
export const getAllDevices = async function (context: Readonly<CoreContext>): Promise<CoreResult> {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'devices',
		action: 'read',
		possession: 'any'
	});

	const devices = await pProps({
		// Scsi: await scsiDevices,
		gpu: await systemGPUDevices,
		audio: await systemAudioDevices,
		// Move this to interfaces
		// network: await si.networkInterfaces(),
		pci: await systemPciDevices(),
		usb: await getSystemUSBDevices()
	});

	return {
		text: `Devices: ${JSON.stringify(devices, null, 2)}`,
		json: devices
	};
};
