import { type NextFunction, type Request, type Response } from 'express';
import { logger, config } from '@app/core';
import { getAllowedOrigins } from '@app/common/allowed-origins';

const getOriginGraphqlError = () => ({
	data: null,
	errors: [{ message: 'The CORS policy for this site does not allow access from the specified Origin.' }],
});

/**
 * Middleware to check a users origin and send a GraphQL error if they are not using a valid one
 * @param req Express Request
 * @param res Express Response
 * @param next Express NextFunction
 * @returns void
 */
export const originMiddleware = (req: Request, res: Response, next: NextFunction): void => {
	// Dev Mode Bypass
	if (process.env.BYPASS_CORS_CHECKS === 'true') {
		logger.warn('BYPASSING_CORS_CHECK: BYPASS_CORS_CHECKS enabled', getAllowedOrigins());
		next();
		return;
	}

	const origin = req.get('Origin');
	const allowedOrigins = getAllowedOrigins();
	logger.trace(`Allowed origins: ${allowedOrigins.join(', ')}, Current Origin: ${origin ?? 'undefined'}`);

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
		logger.error('❌ %s is not in the allowed origins list, denying CORS!', origin.toLowerCase());
		res.status(403).send(getOriginGraphqlError());
		return;
	}

	logger.trace('✔️ Origin check passed, granting CORS!');
	next();
};
