import { ConnectListAllDomainsFlags } from '@vmngr/libvirt';
import { getHypervisor } from '@app/core/utils/vms/get-hypervisor';
import { checkTwoFactorEnabled } from '@app/common/two-factor';
import display from '@app/graphql/resolvers/query/display';
import { docker } from '@app/core/utils/clients/docker';
import { getUnraidVersion } from '@app/common/dashboard/get-unraid-version';
import { getArray } from '@app/common/dashboard/get-array';
import { bootTimestamp } from '@app/common/dashboard/boot-timestamp';
import { Dashboard as DashboardType } from '@app/common/run-time/dashboard';
import { validateRunType } from '@app/common/validate-run-type';
import { logger } from '@app/core/log';
import { getters } from '@app/store';

const getVmSummary = async () => {
	try {
		const hypervisor = await getHypervisor();
		if (!hypervisor) {
			return {
				installed: 0,
				started: 0,
			};
		}

		const activeDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.ACTIVE) as unknown[];
		const inactiveDomains = await hypervisor.connectListAllDomains(ConnectListAllDomainsFlags.INACTIVE) as unknown[];
		return {
			installed: activeDomains.length + inactiveDomains.length,
			started: activeDomains.length,
		};
	} catch {
		return {
			installed: 0,
			started: 0,
		};
	}
};

const twoFactor = () => {
	const { isRemoteEnabled, isLocalEnabled } = checkTwoFactorEnabled();
	return {
		remote: {
			enabled: isRemoteEnabled,
		},
		local: {
			enabled: isLocalEnabled,
		},
	};
};

const services = () => {
	const uptimeTimestamp = bootTimestamp.toISOString();

	return [{
		name: 'unraid-api',
		online: true,
		uptime: {
			timestamp: uptimeTimestamp,
		},
		version: getters.config().api.version,
	}];
};

const getData = async () => {
	const emhttp = getters.emhttp();

	return {
		vars: {
			regState: emhttp.var.regState,
			regTy: emhttp.var.regTy,
			flashGuid: emhttp.var.flashGuid,
		},
		apps: {
			installed: await docker.listContainers({ all: true }).catch(() => []).then(containers => containers.length),
			started: await docker.listContainers().catch(() => []).then(containers => containers.length),
		},
		versions: {
			unraid: await getUnraidVersion(),
		},
		os: {
			hostname: emhttp.var.name,
			uptime: bootTimestamp.toISOString(),
		},
		vms: await getVmSummary(),
		array: getArray(),
		services: services(),
		display: await display(),
		config: {
			valid: emhttp.var.configValid,
			error: emhttp.var.configValid ? null : ({
				error: 'UNKNOWN_ERROR',
				invalid: 'INVALID',
				nokeyserver: 'NO_KEY_SERVER',
				withdrawn: 'WITHDRAWN',
			}[emhttp.var.configState] ?? 'UNKNOWN_ERROR'),
		},
		twoFactor: twoFactor(),
	};
};

export const generateData = async () => {
	const data = await getData();

	try {
		// Validate generated data
		return validateRunType(DashboardType.asPartial(), data);
	} catch (error: unknown) {
		// Log error for user
		logger.error('Failed validating dashboard object', error);
		logger.error('Invalidated dashboard object', data);
	}
};

export type Dashboard = Awaited<ReturnType<typeof generateData>>;
