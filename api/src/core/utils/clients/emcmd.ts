import { got } from 'got'
import { logger } from '@app/core/log';
import { type LooseObject } from '@app/core/types';
import { catchHandlers } from '@app/core/utils/misc/catch-handlers';
import { getters } from '@app/store';
import { DRY_RUN } from '@app/environment';

/**
 * Run a command with emcmd.
 */
export const emcmd = async (commands: LooseObject) => {
	const socketPath = getters.paths()['emhttpd-socket'];
	const { csrfToken } = getters.emhttp().var;

	const url = `http://unix:${socketPath}:/update.htm`;
	const options = {
		qs: {
			...commands,
			csrf_token: csrfToken,
		},
	};

	if (DRY_RUN) {
		logger.debug(url, options);

		// Ensure we only log on dry-run
		return;
	}
	// Untested, this code is unused right now so going to assume it's probably not working well anyway, swapped
	// to got to remove this request-promise dependency
	return got.get(url, { searchParams: { ...commands, csrf_token: csrfToken } }).catch(catchHandlers.emhttpd);
	// return request.get(url, options).catch(catchHandlers.emhttpd);
};
