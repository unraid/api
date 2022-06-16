import { ConnectListAllDomainsFlags } from '@vmngr/libvirt';
import { varState } from '@app/core/states/var';
import { getHypervisor } from '@app/core/utils/vms/get-hypervisor';
import { version } from '@app/../package.json';
import { checkTwoFactorEnabled } from '@app/common/two-factor';
import display from '@app/graphql/resolvers/query/display';
import { docker } from '@app/core/utils/clients/docker';
import { getUnraidVersion } from '@app/common/dashboard/get-unraid-version';
import { getArray } from '@app/common/dashboard/get-array';
import { bootTimestamp } from '@app/common/dashboard/boot-timestamp';

const getVmSummary = async () => {
	try {
		const hypervisor = await getHypervisor();
		if (!hypervisor) {
			return {
				installed: 0,
				started: 0
			};
		}

		const activeDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.ACTIVE) as unknown[];
		const inactiveDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.INACTIVE) as unknown[];
		return {
			installed: activeDomains.length + inactiveDomains.length,
			started: activeDomains.length
		};
	} catch {
		return {
			installed: 0,
			started: 0
		};
	}
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

const services = () => {
	const uptimeTimestamp = bootTimestamp.toISOString();

	return [{
		name: 'unraid-api',
		online: true,
		uptime: {
			timestamp: uptimeTimestamp
		},
		version
	}];
};

export const generateData = async () => ({
	vars: {
		regState: varState.data.regState,
		regTy: varState.data.regTy,
		flashGuid: varState.data.flashGuid
	},
	apps: {
		installed: await docker.listContainers({ all: true }).catch(() => []).then(containers => containers.length),
		started: await docker.listContainers().catch(() => []).then(containers => containers.length)
	},
	versions: {
		unraid: await getUnraidVersion()
	},
	os: {
		hostname: varState.data.name,
		uptime: bootTimestamp
	},
	vms: await getVmSummary(),
	array: getArray(),
	services: services(),
	display: await display(),
	config: {
		valid: varState.data.configValid,
		error: varState.data.configValid ? null : ({
			error: 'UNKNOWN_ERROR',
			invalid: 'INVALID',
			nokeyserver: 'NO_KEY_SERVER',
			withdrawn: 'WITHDRAWN'
		}[varState.data.configState] ?? 'UNKNOWN_ERROR')
	},
	twoFactor: twoFactor()
});
