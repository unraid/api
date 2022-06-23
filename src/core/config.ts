/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { envs } from '@app/core/envs';

const debug = envs.DEBUG;
const nodeEnv = envs.NODE_ENV;
const safeMode = nodeEnv === 'safe-mode';

/**
 * Main config.
 */

export const config = {
	/**
	 * Application is in debug mode
	 *
	 * For example unraid-api --debug
	*/
	debug,
	nodeEnv,
	safeMode,
	port: envs.PORT ?? (nodeEnv === 'development' ? 5000 : '/var/run/unraid-api.sock')
};
