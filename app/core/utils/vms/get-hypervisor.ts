/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import { AppError } from '../../errors';

// Libvirt is an optional dependency
let libvirt;
let client;

export const getHypervisor = async () => {
	// Return client if it's already connected
	if (client) {
		return client;
	}

	// Check if libvirt service is running and then connect
	const running = fs.existsSync('/var/run/libvirt/libvirtd.pid');

	if (!running) {
		throw new AppError('Libvirt service is not running');
	}

	// Try and get dep loaded or throw error
	try {
		libvirt = require('libvirt');
	} catch {
		throw new AppError('Libvirt dep is missing.');
	}

	// Connect to local socket
	const { Hypervisor } = libvirt;
	client = new Hypervisor('qemu:///system');
	await client.connectAsync();
};
