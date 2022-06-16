/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

// import fs from 'fs';
// import { log } from '../log';
import type { CoreContext, CoreResult } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { varState } from '@app/core/states/var';
import { NotImplementedError } from '@app/core/errors/not-implemented-error';
import { AppError } from '@app/core/errors/app-error';

interface Context extends CoreContext {
	data: {
		keyUri?: string;
		trial?: boolean;
		replacement?: boolean;
		email?: string;
		keyFile?: string;
	};
}

interface Result extends CoreResult {
	json: {
		key?: string;
		type?: string;
	};
}

/**
 * Register a license key.
 */
export const addLicenseKey = async (context: Context): Promise<Result | void> => {
	ensurePermission(context.user, {
		resource: 'license-key',
		action: 'create',
		possession: 'any'
	});

	// Const { data } = context;
	const guid = varState?.data?.regGuid;
	// Const timestamp = new Date();

	if (!guid) {
		throw new AppError('guid missing');
	}

	throw new NotImplementedError();

	// // Connect to unraid.net to request a trial key
	// if (data?.trial) {
	// 	const body = new FormData();
	// 	body.append('guid', guid);
	// 	body.append('timestamp', timestamp.getTime().toString());

	// 	const key = await got('https://keys.lime-technology.com/account/trial', { method: 'POST', body })
	// 		.then(response => JSON.parse(response.body))
	// 		.catch(error => {
	// 			log.error(error);
	// 			throw new AppError(`Sorry, a HTTP ${error.status} error occurred while registering USB Flash GUID ${guid}`);
	// 		});

	// 	// Update the trial key file
	// 	await fs.promises.writeFile('/boot/config/Trial.key', Buffer.from(key, 'base64'));

	// 	return {
	// 		text: 'Thank you for registering, your trial key has been accepted.',
	// 		json: {
	// 			key
	// 		}
	// 	};
	// }

	// // Connect to unraid.net to request a new replacement key
	// if (data?.replacement) {
	// 	const { email, keyFile } = data;

	// 	if (!email || !keyFile) {
	// 		throw new AppError('email or keyFile is missing');
	// 	}

	// 	const body = new FormData();
	// 	body.append('guid', guid);
	// 	body.append('timestamp', timestamp.getTime().toString());
	// 	body.append('email', email);
	// 	body.append('keyfile', keyFile);

	// 	const { body: key } = await got('https://keys.lime-technology.com/account/license/transfer', { method: 'POST', body })
	// 		.then(response => JSON.parse(response.body))
	// 		.catch(error => {
	// 			log.error(error);
	// 			throw new AppError(`Sorry, a HTTP ${error.status} error occurred while issuing a replacement for USB Flash GUID ${guid}`);
	// 		});

	// 	// Update the trial key file
	// 	await fs.promises.writeFile('/boot/config/Trial.key', Buffer.from(key, 'base64'));

	// 	return {
	// 		text: 'Thank you for registering, your trial key has been registered.',
	// 		json: {
	// 			key
	// 		}
	// 	};
	// }

	// // Register a new server
	// if (data?.keyUri) {
	// 	const parts = data.keyUri.split('.key')[0].split('/');
	// 	const { [parts.length - 1]: keyType } = parts;

	// 	// Download key blob
	// 	const { body: key } = await got(data.keyUri)
	// 		.then(response => JSON.parse(response.body))
	// 		.catch(error => {
	// 			log.error(error);
	// 			throw new AppError(`Sorry, a HTTP ${error.status} error occurred while registering your key for USB Flash GUID ${guid}`);
	// 		});

	// 	// Save key file
	// 	await fs.promises.writeFile(`/boot/config/${keyType}.key`, Buffer.from(key, 'base64'));

	// 	return {
	// 		text: `Thank you for registering, your ${keyType} key has been accepted.`,
	// 		json: {
	// 			type: keyType
	// 		}
	// 	};
	// }
};
