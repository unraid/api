/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import request from 'request-promise-native';
import { logger } from '@app/core/log';
import { LooseObject } from '@app/core/types';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers';
import { getters } from '@app/store';

/**
 * Run a command with emcmd.
 */
export const emcmd = async (commands: LooseObject) => {
	const socketPath = getters.paths()['emhttpd-socket'];
	const { csrfToken } = getters.emhttp().var;
	const dryRun = process.env.DRY_RUN;

	const url = `http://unix:${socketPath}:/update.htm`;
	const options = {
		qs: {
			...commands,
			csrf_token: csrfToken,
		},
	};

	if (dryRun) {
		logger.debug(url, options);

		// Ensure we only log on dry-run
		return;
	}

	return request.get(url, options).catch(catchHandlers.emhttpd);
};
