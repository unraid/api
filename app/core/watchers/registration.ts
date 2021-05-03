/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { coreLogger, logger } from '../log';
import { varState } from '../states';
import { pubsub } from '../pubsub';
import { getKeyFile } from '../utils';
import { bus } from '../bus';

export const keyFile = () => {
	const listener = async () => {
		// Log for debugging
		coreLogger.debug('Var state updated, publishing registration event.');

		// Get key file
		const keyFile = varState.data.regFile ? await getKeyFile() : '';
		const registration = {
			guid: varState.data.regGuid,
			type: varState.data.regTy.toUpperCase(),
			state: varState.data.regState,
			keyFile: {
				location: varState.data.regFile,
				contents: keyFile
			}
		};

		logger.debug('Publishing %s to registration', JSON.stringify(registration, null, 2));

		// Publish event
		// This will end up going to the graphql endpoint
		await pubsub.publish('registration', {
			registration
		}).catch(error => {
			coreLogger.error('Failed publishing to "registration" with %s', error);
		});
	};

	return {
		start() {
			// Update registration when regTy, regCheck, etc changes
			bus.on('var', listener);
		},
		stop() {
			bus.removeListener('var', listener);
		}
	};
};
