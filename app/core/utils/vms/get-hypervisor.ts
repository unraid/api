/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import path from 'path';
import { Hypervisor } from '@vmngr/libvirt';
import { watch } from 'chokidar';
import { log } from '../../log';
import { pubsub } from '../../pubsub';

const uri = process.env.LIBVIRT_URI ?? 'qemu:///system';

let hypervisor: Hypervisor | null;

const libvirtDir = '/var/run/libvirt/';

// Watch extra origin path for changes
const libvirtDirWatcher = watch(libvirtDir, {
	persistent: true,
	ignoreInitial: true
});

// Restart hypervisor connection
libvirtDirWatcher.on('all', async (event, fileName) => {
	// VM hypervisor stopped
	if (event === 'unlink' && fileName === '/var/run/libvirt/libvirt-sock') {
		// Connection has already been killed
		if (!hypervisor || hypervisor === null) {
			return;
		}

		// Kill connection
		await hypervisor.connectClose().catch(() => {
			return undefined;
		});

		hypervisor = null;
	}

	// VM hypervisor started
	if (event === 'add' && fileName === 'add /var/run/libvirt/qemu/driver.pid') {
		// Start connection
		hypervisor = new Hypervisor({ uri });
		await hypervisor.connectOpen().catch((error: unknown) => {
			log.error(`Failed restarting VM hypervisor connection with "${(error as Error).message}"`);
		});
	}
});

export const getHypervisor = async () => {
	// Return hypervisor if it's already connected
	if (hypervisor) {
		return hypervisor;
	}

	// Check if libvirt service is running and then connect
	const running = fs.existsSync(path.join(libvirtDir, 'libvirtd.pid'));
	if (!running) {
		return null;
	}

	hypervisor = new Hypervisor({ uri });
	await hypervisor.connectOpen().catch((error: unknown) => {
		log.error(`Failed starting VM hypervisor connection with "${(error as Error).message}"`);
	});

	return hypervisor;
};

const sleep = async (ms: number) => new Promise<void>(resolve => {
	setTimeout(() => {
		resolve();
	}, ms);
});

const states = {
	0: 'NOSTATE',
	1: 'RUNNING',
	2: 'IDLE',
	3: 'PAUSED',
	4: 'SHUTDOWN',
	5: 'SHUTOFF',
	6: 'CRASHED',
	7: 'PMSUSPENDED'
};

let cachedDomains;
const watchLibvirt = async () => {
	try {
		const hypervisor = await getHypervisor();
		if (!hypervisor) {
			await sleep(1000);
			return watchLibvirt();
		}

		// We now have a hypervisor instance
		const autoStartDomains = await hypervisor.connectListAllDomains(1024);
		const autoStartDomainNames = await Promise.all(autoStartDomains.map(async domain => hypervisor.domainGetName(domain)));

		// Get all domains
		const domains = await hypervisor.connectListAllDomains();
		const resolvedDomains = await Promise.all(domains.map(async domain => {
			const info = await hypervisor.domainGetInfo(domain);
			const name = await hypervisor.domainGetName(domain);
			const features = {};
			return {
				name,
				uuid: await hypervisor.domainGetUUIDString(domain),
				state: states[info.state],
				autoStart: autoStartDomainNames.includes(name),
				features
			};
		}));

		// If the result is the same as the cache wait 5s then retry
		if (JSON.stringify(cachedDomains) === JSON.stringify(resolvedDomains)) {
			await sleep(5_000);
			return watchLibvirt();
		}

		// Update the cache with new results
		cachedDomains = resolvedDomains;

		// Publish changes to pub/sub
		await pubsub.publish('vms', {
			vms: {
				domain: cachedDomains
			}
		}).catch(error => {
			log.error('Failed publishing to "vms" with %s', error);
		});

		await sleep(1_000);
		return watchLibvirt();
	} catch (error: unknown) {
		await sleep(5_000);
		return watchLibvirt();
	}
};

// Start watching libvirt for changes
watchLibvirt();
