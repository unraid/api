/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import request from 'request-promise-native';
import { envs } from '@app/core/envs';
import { logger } from '@app/core/log';
import { paths } from '@app/core/paths';
import { varState } from '@app/core/states';
import { LooseObject } from '@app/core/types';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers';

const socketPath = paths['emhttpd-socket'];
const dryRun = envs.DRY_RUN;

/**
 * Run a command with emcmd.
 */
export const emcmd = async (commands: LooseObject) => {
	const url = `http://unix:${socketPath}:/update.htm`;
	const options = {
		qs: {
			...commands,
			csrf_token: varState.data?.csrfToken
		}
	};

	if (dryRun) {
		logger.debug(url, options);

		// Ensure we only log on dry-run
		return;
	}

	return request.get(url, options).catch(catchHandlers.emhttpd);
};
