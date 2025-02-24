import type { DomainLookupType } from '@app/core/utils/vms/parse-domain.js';
import { type Domain } from '@app/core/types/index.js';
import { parseDomain } from '@app/core/utils/vms/parse-domain.js';

/**
 * Parse domains.
 */
export const parseDomains = async (type: DomainLookupType, domains: string[]): Promise<Domain[]> =>
    Promise.all(domains.map(async (domain) => parseDomain(type, domain)));
