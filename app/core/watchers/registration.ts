/*!
 * Copyright 2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { coreLogger, logger } from '../log';
import { pubsub } from '../pubsub';
import { getKeyFile } from '../utils';
import { bus } from '../bus';

export const keyFile = () => {
	const listener = async (data: any) => {
		// Log for debugging
		coreLogger.debug('Var state updated, publishing registration event.');

		// Get key file
		const keyFile = data.var.node.regFile ? await getKeyFile() : '';
		const registration = {
			guid: data.var.node.regGuid,
			type: data.var.node.regTy.toUpperCase(),
			state: data.var.node.regState,
			keyFile: {
				location: data.var.node.regFile,
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
