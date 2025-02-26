import { type Domain } from '@app/core/types/index.js';

export type DomainLookupType = 'id' | 'uuid' | 'name';

/**
 * Parse domain
 *
 * @param type What lookup type to use.
 * @param id The domain's ID, UUID or name.
 * @private
 */
export const parseDomain = async (type: DomainLookupType, id: string): Promise<Domain> => {
    const types = {
        id: 'lookupDomainByIdAsync',
        uuid: 'lookupDomainByUUIDAsync',
        name: 'lookupDomainByNameAsync',
    };

    if (!type || !Object.keys(types).includes(type)) {
        throw new Error(`Type must be one of [${Object.keys(types).join(', ')}], ${type} given.`);
    }

    const { UnraidHypervisor } = await import('@app/core/utils/vms/get-hypervisor.js');
    const client = await UnraidHypervisor.getInstance().getHypervisor();
    const method = types[type];
    const domain = await client[method](id);
    const info = await domain.getInfoAsync();

    const [uuid, osType, autostart, maxMemory, schedulerType, schedulerParameters, securityLabel, name] =
        await Promise.all([
            domain.getUUIDAsync(),
            domain.getOSTypeAsync(),
            domain.getAutostartAsync(),
            domain.getMaxMemoryAsync(),
            domain.getSchedulerTypeAsync(),
            domain.getSchedulerParametersAsync(),
            domain.getSecurityLabelAsync(),
            domain.getNameAsync(),
        ]);

    const results = {
        uuid,
        osType,
        autostart,
        maxMemory,
        schedulerType,
        schedulerParameters,
        securityLabel,
        name,
        ...info,
        state: info.state.replace(' ', '_'),
    };

    if (info.state === 'running') {
        results.vcpus = await domain.getVcpusAsync();
        results.memoryStats = await domain.getMemoryStatsAsync();
    }

    return results;
};
