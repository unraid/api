import { type NextFunction, type Request, type Response } from 'express';
import { logger } from '@app/core';
import { getAllowedOrigins } from '@app/common/allowed-origins';

const getOriginGraphqlError = () => ({
    data: null,
    errors: [
        {
            message:
                'The CORS policy for this site does not allow access from the specified Origin.',
        },
    ],
});

/**
 * Middleware to check a users origin and send a GraphQL error if they are not using a valid one
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns void
 */
export const originMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    // Dev Mode Bypass
    const origin = req.get('Origin');
    const allowedOrigins = getAllowedOrigins();

    if (process.env.BYPASS_CORS_CHECKS === 'true') {
        logger.addContext('cors', allowedOrigins);
        logger.warn(`BYPASSING_CORS_CHECK: %o`, req.headers);
        logger.removeContext('cors');
        next();
        return;
    } else {
        logger.addContext('origins', allowedOrigins.join(', '))
        logger.trace(
            `Current Origin: ${
                origin ?? 'undefined'
            }`
        );
        logger.removeContext('origins')
    }

    // Disallow requests with no origin
    // (like mobile apps, curl requests or viewing /graphql directly)
    if (!origin) {
        logger.debug('No origin provided, denying CORS!');
        res.status(403).send(getOriginGraphqlError());
        return;
    }

    logger.trace(`📒 Checking "${origin.toLowerCase()}" for CORS access.`);

    // Only allow known origins
    if (!allowedOrigins.includes(origin.toLowerCase())) {
        logger.error(
            '❌ %s is not in the allowed origins list, denying CORS!',
            origin.toLowerCase()
        );
        res.status(403).send(getOriginGraphqlError());
        return;
    }

    logger.trace('✔️ Origin check passed, granting CORS!');
    next();
};
