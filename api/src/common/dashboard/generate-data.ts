import { ConnectListAllDomainsFlags } from '@vmngr/libvirt';
import { getHypervisor } from '@app/core/utils/vms/get-hypervisor';
import display from '@app/graphql/resolvers/query/display';
import { docker } from '@app/core/utils/clients/docker';
import { getUnraidVersion } from '@app/common/dashboard/get-unraid-version';
import { getArray } from '@app/common/dashboard/get-array';
import { bootTimestamp } from '@app/common/dashboard/boot-timestamp';
import { dashboardLogger } from '@app/core/log';
import { getters, store } from '@app/store';
import { type DashboardServiceInput, type DashboardInput } from '@app/graphql/generated/client/graphql';
import { API_VERSION } from '@app/environment';
import { DynamicRemoteAccessType } from '@app/remoteAccess/types';
import { DashboardInputSchema } from '@app/graphql/generate/validators';

const getVmSummary = async (): Promise<DashboardInput['vms']> => {
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

/*
const twoFactor = (): Dashboard['twoFactor'] => {
	const { isRemoteEnabled, isLocalEnabled } = checkTwoFactorEnabled();
	return {
		remote: {
			enabled: isRemoteEnabled,
		},
		local: {
			enabled: isLocalEnabled,
		},
	};
}; */

const getDynamicRemoteAccessService = (): DashboardServiceInput | null => {
	const uptimeTimestamp = bootTimestamp.toISOString();

	const { config, dynamicRemoteAccess } = store.getState();
	const enabledStatus = config.remote.dynamicRemoteAccessType;

	return {
		name: 'dynamic-remote-access',
		online: enabledStatus !== DynamicRemoteAccessType.DISABLED,
		version: dynamicRemoteAccess.runningType,
		uptime: {
			timestamp: new Date(uptimeTimestamp),
		},
	};
};

const services = (): DashboardInput['services'] => {
	const uptimeTimestamp = bootTimestamp.toISOString();
	const dynamicRemoteAccess = getDynamicRemoteAccessService();
	return [{
		name: 'unraid-api',
		online: true,
		uptime: {
			timestamp: new Date(uptimeTimestamp),
		},
		version: API_VERSION,
	},
	...(dynamicRemoteAccess ? [dynamicRemoteAccess] : [])];
};

const getData = async (): Promise<DashboardInput> => {
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
			uptime: new Date(bootTimestamp.toISOString()),
		},
		vms: await getVmSummary(),
		array: getArray(),
		services: services(),
		display: await display(),
		config: emhttp.var.configValid ? { valid: true } : {
			valid: false,
			error: {
				error: 'UNKNOWN_ERROR',
				invalid: 'INVALID',
				nokeyserver: 'NO_KEY_SERVER',
				withdrawn: 'WITHDRAWN',
			}[emhttp.var.configState] ?? 'UNKNOWN_ERROR',
		},
	};
};

export const generateData = async (): Promise<DashboardInput | null> => {
	const data = await getData();

	try {
		// Validate generated data
		// @TODO: Fix this runtype to use generated types from the Zod validators (as seen in mothership Codegen)
		const result = DashboardInputSchema().parse(data)

		return result

	} catch (error: unknown) {
		// Log error for user
		dashboardLogger.error('Failed validating dashboard object: ', error, data);
	}

	return null;
};

