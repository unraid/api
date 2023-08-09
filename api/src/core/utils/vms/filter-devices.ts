import { execa } from 'execa';
import { map as asyncMap } from 'p-iteration';
import { sync as commandExistsSync } from 'command-exists';

interface Device {
	id: string;
	allowed: boolean;
}

/**
 * Sets device.allowed to true/false.
 *
 * @param devices Devices to be checked.
 * @returns Processed devices.
 */
export const filterDevices = async (devices: Device[]): Promise<Device[]> => asyncMap(devices, async (device: Device) => {
	// Don't run if we don't have the udevadm command available
	if (!commandExistsSync('udevadm')) return device;

	const networkDeviceIds = await execa('udevadm', 'info -q path -p /sys/class/net/eth0'.split(' '))
		.then(({ stdout }) => {
			const regex = /0{4}:\w{2}:(\w{2}\.\w)/g;
			return stdout.match(regex) ?? [];
		})
		.catch(() => []);

	const allowed = new Set(networkDeviceIds);
	device.allowed = allowed.has(device.id);

	return device;
});
