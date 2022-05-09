import { uptime } from 'os';
import pProps from 'p-props';
import si from 'systeminformation';
import { ConnectListAllDomainsFlags } from '@vmngr/libvirt';
import { varState } from '../../core/states/var';
import { getHypervisor } from '../../core/utils/vms/get-hypervisor';
import { version } from '../../../package.json';
import { slotsState } from '../../core/states/slots';
import { addTogether } from '../../core/utils/misc/add-together';
import { checkTwoFactorEnabled } from '../two-factor';
import display from '../../graphql/resolvers/query/display';

const getVmSummary = async () => {
	const hypervisor = await getHypervisor();
	if (!hypervisor) {
		return {
			installed: -1,
			started: -1
		};
	}

	const activeDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.ACTIVE) as unknown[];
	const inactiveDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.INACTIVE) as unknown[];
	return {
		installed: activeDomains.length + inactiveDomains.length,
		started: activeDomains.length
	};
};

const getArray = () => {
	// Array state
	const arrayState = varState?.data?.mdState.toLowerCase();
	const state: string = arrayState.startsWith('error') ? arrayState.split(':')[1] : arrayState;

	// All known disks
	const allDisks = slotsState.find().filter(disk => disk.device);

	// Array disks
	const disks = allDisks.filter(disk => disk.name.startsWith('disk'));

	// Disk sizes
	const disksTotalBytes = addTogether(disks.map(_ => _.fsSize * 1024));
	const disksFreeBytes = addTogether(disks.map(_ => _.fsFree * 1024));

	// Max
	const maxDisks = varState?.data?.maxArraysz ?? disks.length;

	return {
		state,
		capacity: {
			bytes: {
				free: disksFreeBytes,
				used: disksTotalBytes - disksFreeBytes,
				total: disksTotalBytes
			},
			disks: {
				free: maxDisks - disks.length,
				used: disks.length,
				total: maxDisks
			}
		}
	};
};

const twoFactor = () => {
	const { isRemoteEnabled, isLocalEnabled } = checkTwoFactorEnabled();
	return {
		remote: {
			enabled: isRemoteEnabled
		},
		local: {
			enabled: isLocalEnabled
		}
	};
};

// Get uptime on boot and convert to date
const bootTimestamp = new Date(new Date().getTime() - (uptime() * 1000));

const services = () => {
	const now = new Date();
	const uptimeTimestamp = bootTimestamp.toISOString();
	const uptimeSeconds = (now.getTime() - bootTimestamp.getTime());

	return [{
		name: 'unraid-api',
		online: true,
		uptime: {
			timestamp: uptimeTimestamp,
			seconds: uptimeSeconds
		},
		version
	}];
};

export const generateData = async () => pProps({
	vars: {
		regState: varState.data.regState,
		regTy: varState.data.regTy,
		flashGuid: varState.data.flashGuid
	},
	apps: {
		installed: 0,
		started: 0
	},
	versions: {
		unraid: 0
	},
	os: {
		hostname: si.osInfo().then(osInfo => osInfo.hostname),
		uptime: bootTimestamp
	},
	vms: getVmSummary(),
	array: getArray(),
	services: services(),
	display: display(),
	config: {
		valid: varState.data.configValid,
		error: varState.data.configValid ? undefined : ({
			error: 'UNKNOWN_ERROR',
			invalid: 'INVALID',
			nokeyserver: 'NO_KEY_SERVER',
			withdrawn: 'WITHDRAWN'
		}[varState.data.configState] ?? 'UNKNOWN_ERROR')
	},
	twoFactor: twoFactor()
});
