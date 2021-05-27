/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import { AppError } from '../../errors';
import libvirt from '@vmngr/libvirt';

const uri = process.env.LIBVIRT_URI ?? 'qemu:///system';

let hypervisor: libvirt.Hypervisor;

export const getHypervisor = async () => {
	// Return hypervisor if it's already connected
	if (hypervisor) {
		return hypervisor;
	}

	// Check if libvirt service is running and then connect
	const running = fs.existsSync('/var/run/libvirt/libvirtd.pid');
	if (!running) {
		throw new AppError('Libvirt service is not running');
	}

	hypervisor = new libvirt.Hypervisor({ uri });
	await hypervisor.connectOpen();

	return hypervisor;
};
