/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import path from 'path';
import { AppError } from '../../errors';
import { Hypervisor } from '@vmngr/libvirt';
import { watch } from 'chokidar';
import { log } from '../../log';

const uri = process.env.LIBVIRT_URI ?? 'qemu:///system';

let hypervisor: Hypervisor;

const libvirtDir = '/var/run/libvirt/';

export const getHypervisor = async () => {
	// Return hypervisor if it's already connected
	if (hypervisor) {
		return hypervisor;
	}

	// Check if libvirt service is running and then connect
	const running = fs.existsSync(path.join(libvirtDir, 'libvirtd.pid'));
	if (!running) {
		throw new AppError('Libvirt service is not running');
	}

	// Watch extra origin path for changes
	const libvirtDirWatcher = watch(libvirtDir, {
		persistent: true,
		ignoreInitial: true
	});

	// Restart hypervisor connection
	libvirtDirWatcher.on('all', async (event, fileName) => {
		// VM hypervisor stopped
		if (event === 'unlink' && fileName === '/var/run/libvirt/libvirt-sock') {
			// Kill connection
			await hypervisor.connectClose().catch((error: unknown) => {
				log.error(`Failed killing VM hypervisor connection with "${(error as Error).message}"`);
			});
		}

		// VM hypervisor started
		if (event === 'add' && fileName === 'add /var/run/libvirt/qemu/driver.pid') {
			// Start connection
			await hypervisor.connectOpen().catch((error: unknown) => {
				log.error(`Failed restarting VM hypervisor connection with "${(error as Error).message}"`);
			});
		}
	});

	hypervisor = new Hypervisor({ uri });
	await hypervisor.connectOpen().catch((error: unknown) => {
		log.error(`Failed starting VM hypervisor connection with "${(error as Error).message}"`);
	});

	return hypervisor;
};
