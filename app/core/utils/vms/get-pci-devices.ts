/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import execa from 'execa';
import { cleanStdout } from '..';
import { PciDevice } from '../../types';

const regex = new RegExp(/^(?<id>\S+) "(?<type>[^"]+) \[(?<typeid>[\da-f]{4})]" "(?<vendorname>[^"]+) \[(?<vendorid>[\da-f]{4})]" "(?<productname>[^"]+) \[(?<productid>[\da-f]{4})]"/);

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
