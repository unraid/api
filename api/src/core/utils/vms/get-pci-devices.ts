import { execa } from 'execa';
import { type PciDevice } from '@app/core/types';
import { cleanStdout } from '@app/core/utils/misc/clean-stdout';

const regex = new RegExp(/^(?<id>\S+) "(?<type>[^"]+) \[(?<typeid>[a-f\d]{4})]" "(?<vendorname>[^"]+) \[(?<vendorid>[a-f\d]{4})]" "(?<productname>[^"]+) \[(?<productid>[a-f\d]{4})]"/);

/**
 * Get pci devices.
 *
 * @returns Array of PCI devices
 */
export const getPciDevices = async (): Promise<PciDevice[]> => {
	const devices = await execa('lspci', ['-m', '-nn'])
		.catch(() => ({ stdout: '' }))
		.then(cleanStdout);

	if (devices === '') {
		return [];
	}

	return devices.split('\n').map(line => (regex.exec(line)?.groups as unknown as PciDevice)).filter(Boolean);
};
