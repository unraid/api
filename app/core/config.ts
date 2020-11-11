/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { envs } from './envs';

const debug = envs.DEBUG;
const nodeEnv = envs.NODE_ENV;
const safe = nodeEnv === 'safe-mode';
const dev = nodeEnv === 'development';

/**
 * Main config.
 */
export const config = new Map<string, boolean | string | number>([
	['debug', debug],
	['node-env', nodeEnv],
	['safe-mode', safe],
	['port', envs.PORT ?? (dev ? 5000 : '/var/run/unraid-api.sock')],
	['system-version-cache-expiry', 30000] // 30s
]);
