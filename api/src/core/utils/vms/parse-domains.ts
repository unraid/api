/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { type Domain } from '@app/core/types';
import { type DomainLookupType, parseDomain } from '@app/core/utils/vms/parse-domain';

/**
 * Parse domains.
 */
export const parseDomains = async (type: DomainLookupType, domains: string[]): Promise<Domain[]> => Promise.all(domains.map(async domain => parseDomain(type, domain)));
