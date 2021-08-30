/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { environmentVariables } from './environments';

const debug = environmentVariables.DEBUG;
const nodeEnvironment = environmentVariables.NODE_ENV;
const safe = nodeEnvironment === 'safe-mode';
const development = nodeEnvironment === 'development';

/**
 * Main config.
 */
export const config = new Map<string, boolean | string | number>([
	['debug', debug],
	['node-env', nodeEnvironment],
	['safe-mode', safe],
	['port', environmentVariables.PORT ?? (development ? 5000 : '/var/run/unraid-api.sock')],
	['system-version-cache-expiry', 30_000] // 30s
]);
