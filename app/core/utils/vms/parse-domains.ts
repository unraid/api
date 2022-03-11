/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { Domain } from '../../types';
import { DomainLookupType, parseDomain } from './parse-domain';

/**
 * Parse domains.
 */
export const parseDomains = async (type: DomainLookupType, domains: string[]): Promise<Domain[]> => {
	return Promise.all(domains.map(async domain => parseDomain(type, domain)));
};
