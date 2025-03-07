import { type CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface.js';

import { GraphQLError } from 'graphql';

import { getAllowedOrigins } from '@app/common/allowed-origins.js';
import { apiLogger } from '@app/core/log.js';
import { BYPASS_CORS_CHECKS } from '@app/environment.js';
import { FastifyRequest } from '@app/types/fastify.js';
import { type CookieService } from '@app/unraid-api/auth/cookie.service.js';

/**
 * Returns whether the origin is allowed to access the API.
 *
 * @throws GraphQLError if the origin is not in the list of allowed origins
 * and `BYPASS_CORS_CHECKS` flag is not set.
 */
// note: don't make this function synchronous. throwing will then crash the server.
export async function isOriginAllowed(origin: string | undefined) {
    const allowedOrigins = getAllowedOrigins();
    if (origin && allowedOrigins.includes(origin)) {
        return true;
    } else {
        apiLogger.debug(`Origin not in allowed origins: ${origin}`);

        if (BYPASS_CORS_CHECKS) {
            return true;
        }

        throw new GraphQLError(
            'The CORS policy for this site does not allow access from the specified Origin.'
        );
    }
}

/**------------------------------------------------------------------------
 * ?                       Fastify Cors Config
 *
 *  The fastify cors configuration function is very different from express,
 *  but Nest.js doesn't have clear docs or types describing this so I'm
 *  documenting it here.
 *
 *  This takes a fastify app instance and returns a cors config function, instead
 *  of just the cors config function (which is nest's default behavior).
 *------------------------------------------------------------------------**/

/**
 * A wrapper function for the fastify CORS configuration, which
 * takes a CookieService (i.e. a singleton from Nest.js) and returns a
 * fastify CORS config function. This function:
 *
 * Dynamically determines the CORS config for a request.
 *
 * - Expects any cookies to be parsed & available on the `cookies` property of the request.
 *
 * If the request contains a valid unraid session cookie, it is allowed to access
 * the API from any origin. Otherwise, the origin must be explicitly listed in
 * the `allowedOrigins` config option, or the `BYPASS_PERMISSION_CHECKS` flag
 * must be set.
 */
export const configureFastifyCors =
    (service: CookieService) =>
    // this is the function that nestApp.enableCors() needs when configured to use fastify
    () =>
    /**
     * Our CORS handler function. It dynamically determines the CORS config for a request.
     *
     * @param req the request object
     * @param callback the callback to call with the CORS options
     */
    (req: FastifyRequest, callback: (error: Error | null, options: CorsOptions) => void) => {
        const { cookies } = req;
        if (cookies && typeof cookies === 'object') {
            service.hasValidAuthCookie(cookies).then((isValid) => {
                if (isValid) {
                    callback(null, { credentials: true, origin: true });
                } else {
                    callback(null, { credentials: true, origin: isOriginAllowed });
                }
            });
        } else {
            callback(null, { credentials: true, origin: isOriginAllowed });
        }
    };
