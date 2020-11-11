/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { parseDomain, DomainLookupType } from '..';
import { Domain } from '../../types';

/**
 * Parse domains.
 */
export const parseDomains = async(type: DomainLookupType, domains: string[]): Promise<Domain[]> => {
	return Promise.all(domains.map(domain => parseDomain(type, domain)));
};
