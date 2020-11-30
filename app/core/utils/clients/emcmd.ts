/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import request from 'request-promise-native';
import { envs } from '../../envs';
import { coreLogger } from '../../log';
import { catchHandlers } from '..';
import { paths } from '../../paths';
import { varState } from '../../states';
import { LooseObject } from '../../types';

const socketPath = paths.get('emhttpd-socket')!;
const dryRun = envs.DRY_RUN;

/**
 * Run a command with emcmd.
 */
export const emcmd = async(commands: LooseObject) => {
	const url = `http://unix:${socketPath}:/update.htm`;
	const options = {
		qs: {
			...commands,
			csrf_token: varState.data?.csrfToken
		}
	};

	if (dryRun) {
		coreLogger.debug(url, options);

		// Ensure we only log on dry-run
		return;
	}

	return request.get(url, options).catch(catchHandlers.emhttpd);
};
