import { Controller, Get, Logger, Param, Query, Req, Res, UnauthorizedException } from '@nestjs/common';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import type { FastifyReply, FastifyRequest } from '@app/unraid-api/types/fastify.js';
import { Public } from '@app/unraid-api/auth/public.decorator.js';
import { OidcAuthService } from '@app/unraid-api/graph/resolvers/sso/oidc-auth.service.js';
import { OidcRequestHandler } from '@app/unraid-api/graph/resolvers/sso/oidc-request-handler.util.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

// Removed validateRedirectUri - using redirect_uri from query params directly

@Controller()
export class RestController {
    protected logger = new Logger(RestController.name);
    constructor(
        private readonly restService: RestService,
        private readonly oidcAuthService: OidcAuthService
    ) {}

    @Get('/')
    @Public()
    async getRoot() {
        return 'OK';
    }

    @Get('/graphql/api/logs')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.LOGS,
    })
    async getLogs(@Res() res: FastifyReply) {
        try {
            const logStream = await this.restService.getLogs();
            return res.status(200).type('application/x-gtar').send(logStream);
        } catch (error: unknown) {
            this.logger.error(error);
            return res.status(500).send(`Error: Failed to get logs`);
        }
    }

    @Get('/graphql/api/customizations/:type')
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.CUSTOMIZATIONS,
    })
    async getCustomizations(@Param('type') type: string, @Res() res: FastifyReply) {
        if (type !== 'banner' && type !== 'case') {
            throw new Error('Invalid Customization Type');
        }

        try {
            const customizationStream = await this.restService.getCustomizationStream(type);
            return res.status(200).type('image/png').send(customizationStream);
        } catch (error: unknown) {
            this.logger.error(error);
            return res.status(500).send(`Error: Failed to get customizations`);
        }
    }

    @Get(
        process.env.NODE_ENV === 'development'
            ? ['/graphql/api/auth/oidc/authorize/:providerId', '/api/auth/oidc/authorize/:providerId']
            : ['/graphql/api/auth/oidc/authorize/:providerId']
    )
    @Public()
    async oidcAuthorize(
        @Param('providerId') providerId: string,
        @Query('state') state: string,
        @Query('redirect_uri') redirectUri: string,
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply
    ) {
        try {
            // Validate required parameters
            const params = OidcRequestHandler.validateAuthorizeParams(providerId, state, redirectUri);

            // IMPORTANT: Use the redirect_uri from query params directly
            // Do NOT parse headers or try to build/validate against headers
            // The frontend provides the complete redirect_uri
            if (!params.redirectUri) {
                return res.status(400).send('redirect_uri parameter is required');
            }

            // Handle authorization flow using the exact redirect_uri from query params
            const authUrl = await OidcRequestHandler.handleAuthorize(
                params.providerId,
                params.state,
                params.redirectUri,
                req,
                this.oidcAuthService,
                this.logger
            );

            // Manually set redirect headers for better proxy compatibility
            res.status(302);
            res.header('Location', authUrl);
            return res.send();
        } catch (error: unknown) {
            this.logger.error(`OIDC authorize error for provider ${providerId}:`, error);

            // Log more details about the error
            if (error instanceof Error) {
                this.logger.error(`Error message: ${error.message}`);
                if (error.stack) {
                    this.logger.debug(`Stack trace: ${error.stack}`);
                }
            }

            return res.status(400).send('Invalid provider or configuration');
        }
    }

    @Get(
        process.env.NODE_ENV === 'development'
            ? ['/graphql/api/auth/oidc/callback', '/api/auth/oidc/callback']
            : ['/graphql/api/auth/oidc/callback']
    )
    @Public()
    async oidcCallback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply
    ) {
        try {
            // Validate required parameters
            const params = OidcRequestHandler.validateCallbackParams(code, state);

            // Handle callback flow
            const result = await OidcRequestHandler.handleCallback(
                params.code,
                params.state,
                req,
                this.oidcAuthService,
                this.logger
            );

            // Redirect to login page with the token in hash to keep it out of server logs
            const loginUrl = `/login#token=${encodeURIComponent(result.paddedToken)}`;

            // Manually set redirect headers for better proxy compatibility
            res.header('Cache-Control', 'no-store');
            res.header('Pragma', 'no-cache');
            res.header('Expires', '0');
            res.status(302);
            res.header('Location', loginUrl);
            return res.send();
        } catch (error: unknown) {
            this.logger.error(`OIDC callback error: ${error}`);

            // Use a generic error message to avoid leaking sensitive information
            const errorMessage = 'Authentication failed';

            // Log detailed error for debugging but don't expose to user
            if (error instanceof UnauthorizedException) {
                this.logger.debug(`UnauthorizedException occurred during OIDC callback`);
            } else if (error instanceof Error) {
                this.logger.debug(`Error during OIDC callback: ${error.message}`);
            }

            const loginUrl = `/login#error=${encodeURIComponent(errorMessage)}`;

            res.status(302);
            res.header('Location', loginUrl);
            return res.send();
        }
    }
}
