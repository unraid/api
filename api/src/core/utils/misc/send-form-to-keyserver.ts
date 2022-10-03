import { AppError } from '@app/core/errors/app-error';
import { logger } from '@app/core/log';
import { got } from 'got';

export const sendFormToKeyServer = async (url: string, data: Record<string, unknown>) => {
	if (!data) {
		throw new AppError('Missing data field.');
	}

	// Create form
	const form = new URLSearchParams();
	Object.entries(data).forEach(([key, value]) => {
		if (value !== undefined) {
			form.append(key, String(value));
		}
	});

	// Convert form to string
	const body = form.toString();
	logger.addContext('form', body);
	logger.trace('Sending form to key-server');
	logger.removeContext('form');

	// Send form
	return got(url, {
		method: 'POST',
		headers: {
			'content-type': 'application/x-www-form-urlencoded',
		},
		timeout: {
			request: 5_000,
		},
		throwHttpErrors: true,
		body,
	});
};
