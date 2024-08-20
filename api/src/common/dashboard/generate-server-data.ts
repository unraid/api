import { ConnectListAllDomainsFlags } from '@vmngr/libvirt';
import { getHypervisor } from '@app/core/utils/vms/get-hypervisor';
import { getUnraidVersion } from '@app/common/dashboard/get-unraid-version';
import { bootTimestamp } from '@app/common/dashboard/boot-timestamp';
import { getters, store } from '@app/store';

import { API_VERSION } from '@app/environment';
import { DynamicRemoteAccessType } from '@app/remoteAccess/types';
import {
    DashboardService,
    Dashboard,
    DashboardArray,
    ArrayState,
} from '@app/graphql/generated/api/types';
import convert from 'convert';
import { getArrayData } from '@app/core/modules/array/get-array-data';
import { hostname } from 'os';

const getVmSummary = async (): Promise<Dashboard['vms']> => {
    try {
        const hypervisor = await getHypervisor();
        if (!hypervisor) {
            return {
                installed: 0,
                started: 0,
            };
        }

        const activeDomains = (await hypervisor.connectListAllDomains(
            ConnectListAllDomainsFlags.ACTIVE
        )) as unknown[];
        const inactiveDomains = (await hypervisor.connectListAllDomains(
            ConnectListAllDomainsFlags.INACTIVE
        )) as unknown[];
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

const getDynamicRemoteAccessService = (): DashboardService | null => {
    const { config, dynamicRemoteAccess } = store.getState();
    const enabledStatus = config.remote.dynamicRemoteAccessType;

    return {
        name: 'dynamic-remote-access',
        online: enabledStatus !== DynamicRemoteAccessType.DISABLED,
        version: dynamicRemoteAccess.runningType,
        uptime: {
            timestamp: bootTimestamp.toISOString(),
        },
    };
};

const services = (): Dashboard['services'] => {
    const dynamicRemoteAccess = getDynamicRemoteAccessService();
    return [
        {
            name: 'unraid-api',
            online: true,
            uptime: {
                timestamp: bootTimestamp.toISOString(),
            },
            version: API_VERSION,
        },
        ...(dynamicRemoteAccess ? [dynamicRemoteAccess] : []),
    ];
};

const KBToB = (kb: number | string): number =>
    convert(Number(kb), 'KB').to('B');

export const getArray = (): DashboardArray => {
    const array = getArrayData();
    if (!array) {
        return {
            state: ArrayState.STOPPED,
            capacity: {
                bytes: { free: 0, used: 0, total: 0 },
                disks: { free: '0', used: '0', total: '0' },
                kilobytes: { free: '0', used: '0', total: '0' },
            },
        };
    }

    return {
        state: array.state ?? ArrayState.STOPPED,
        capacity: array.capacity,
    };
};

const getData = async (): Promise<Dashboard> => {
    const emhttp = getters.emhttp();
    const docker = getters.docker();

    return {
        id: hostname() ?? 'unraid',
        vars: {
            regState: emhttp.var.regState,
            regTy: emhttp.var.regTy,
            flashGuid: emhttp.var.flashGuid,
            serverName: emhttp.var.name,
            serverDescription: emhttp.var.comment,
        },
        apps: {
            installed: docker.installed ?? 0,
            started: docker.running ?? 0,
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
        display: {
            case: {
                url: '',
                icon: '',
                error: '',
                base64: '',
            },
        },
        config: emhttp.var.configValid
            ? { valid: true }
            : {
                  valid: false,
                  error:
                      {
                          error: 'UNKNOWN_ERROR',
                          invalid: 'INVALID',
                          nokeyserver: 'NO_KEY_SERVER',
                          withdrawn: 'WITHDRAWN',
                      }[emhttp.var.configState] ?? 'UNKNOWN_ERROR',
              },
    };
};

/**
 * Provides a way to get dashboard data from the GraphQL client without the need for publishing to mothership
 * @returns Dashboard data
 */
export const dashboardDataServer = async (): Promise<Dashboard> => {
    return await getData();
};
