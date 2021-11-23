/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import fs from 'fs';
import path from 'path';
import { ConnectListAllDomainsFlags, Hypervisor } from '@vmngr/libvirt';
import { watch } from 'chokidar';
import { libvirtLogger } from '../../log';
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
	if (event === 'add' && fileName === '/var/run/libvirt/libvirt-sock') {
		// Start connection
		hypervisor = new Hypervisor({ uri });
		await hypervisor.connectOpen().catch((error: unknown) => {
			libvirtLogger.error(`Failed restarting VM hypervisor connection with "${(error as Error).message}"`);
		});
	}
});

export const getHypervisor = async (useCache = true) => {
	// Return hypervisor if it's already connected
	if (useCache && hypervisor) {
		return hypervisor;
	}

	// Check if libvirt service is running and then connect
	const running = fs.existsSync(path.join(libvirtDir, 'libvirtd.pid'));
	if (!running) {
		return null;
	}

	hypervisor = new Hypervisor({ uri });
	await hypervisor.connectOpen().catch((error: unknown) => {
		libvirtLogger.error(`Failed starting VM hypervisor connection with "${(error as Error).message}"`);
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

let cachedDomains: Array<{
	name: string;
	uuid: string;
	state: string;
	autoStart: boolean;
	features: Record<string, unknown>;
}>;

const watchLibvirt = async (useCache = true) => {
	try {
		const hypervisor = await getHypervisor(useCache);
		if (!hypervisor) {
			await sleep(1000);
			return watchLibvirt(useCache);
		}

		// We now have a hypervisor instance
		const autoStartDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.AUTOSTART);
		const autoStartDomainNames = await Promise.all(autoStartDomains.map(async domain => hypervisor.domainGetName(domain))) ?? [];

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
			libvirtLogger.trace('No changes detected.');
			await sleep(5_000);
			return watchLibvirt();
		}

		libvirtLogger.debug('Changes detected!');

		// Update the cache with new results
		cachedDomains = resolvedDomains;

		// Update summary endpoint
		const activeDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.ACTIVE);
		const inactiveDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.INACTIVE);
		const installed = activeDomains.length + inactiveDomains.length;
		const started = activeDomains.length;
		const summary = {
			info: {
				vms: {
					installed,
					started
				}
			}
		};
		const full = {
			vms: {
				domain: cachedDomains
			}
		};

		// Publish changes to pub/sub
		await pubsub.publish('info', summary).catch(error => {
			libvirtLogger.error('Failed publishing to "info" with "%s"', error);
		});

		// Publish changes to pub/sub
		await pubsub.publish('vms', full).catch(error => {
			libvirtLogger.error('Failed publishing to "vms" with "%s"', error);
		});

		libvirtLogger.debug('Published full and summary data to pub/sub');

		await sleep(1_000);
		return watchLibvirt();
	} catch (error: unknown) {
		// We need to try and reconnect
		if ((error as Error).message.includes('invalid connection pointer')) {
			libvirtLogger.warn('Reconnecting to socket...');
			await sleep(5_000);
			return watchLibvirt(false);
		}

		libvirtLogger.error('Failed watching with "%s"', error);
		await sleep(5_000);
		return watchLibvirt();
	}
};

// Start watching libvirt for changes
watchLibvirt();
