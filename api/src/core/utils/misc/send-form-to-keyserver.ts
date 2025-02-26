import type { CancelableRequest, Response } from 'got';
import { got } from 'got';

import { AppError } from '@app/core/errors/app-error.js';
import { logger } from '@app/core/log.js';

export const sendFormToKeyServer = async (
    url: string,
    data: Record<string, unknown>
): Promise<CancelableRequest<Response<string>>> => {
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

    logger.trace({ form: body }, 'Sending form to key-server');

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
