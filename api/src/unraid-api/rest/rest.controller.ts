import { Controller, Get, Logger, Param, Query, Req, Res } from '@nestjs/common';

import { Resource } from '@unraid/shared/graphql.model.js';
import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { FastifyReply, FastifyRequest } from '@app/unraid-api/types/fastify.js';
import { Public } from '@app/unraid-api/auth/public.decorator.js';
import { OidcAuthService } from '@app/unraid-api/graph/resolvers/sso/oidc-auth.service.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

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
        action: AuthActionVerb.READ,
        resource: Resource.LOGS,
        possession: AuthPossession.ANY,
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
        action: AuthActionVerb.READ,
        resource: Resource.CUSTOMIZATIONS,
        possession: AuthPossession.ANY,
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

    @Get(['/graphql/api/auth/oidc/authorize/:providerId', '/api/auth/oidc/authorize/:providerId'])
    @Public()
    async oidcAuthorize(
        @Param('providerId') providerId: string,
        @Query('state') state: string,
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply
    ) {
        try {
            if (!state) {
                return res.status(400).send('State parameter is required');
            }

            // Get the host from the request headers
            const host = req.headers.host || undefined;

            const authUrl = await this.oidcAuthService.getAuthorizationUrl(providerId, state, host);
            this.logger.log(`Redirecting to OIDC provider: ${authUrl}`);

            // Manually set redirect headers for better proxy compatibility
            res.status(302);
            res.header('Location', authUrl);
            return res.send();
        } catch (error: unknown) {
            this.logger.error(`OIDC authorize error for provider ${providerId}:`, error);
            return res.status(400).send('Invalid provider or configuration');
        }
    }

    @Get(['/graphql/api/auth/oidc/callback', '/api/auth/oidc/callback'])
    @Public()
    async oidcCallback(
        @Query('code') code: string,
        @Query('state') state: string,
        @Req() req: FastifyRequest,
        @Res() res: FastifyReply
    ) {
        try {
            if (!code || !state) {
                return res.status(400).send('Missing required parameters');
            }

            // For the callback, we need to determine which provider this is for
            // This is a limitation of the current design - we'll need to enhance this
            // For now, assume it's unraid.net since that's what we're testing
            const providerId = 'unraid.net'; // TODO: Store provider ID in session or state

            // Get the host from the request headers
            const host = req.headers.host || undefined;

            const paddedToken = await this.oidcAuthService.handleCallback(providerId, code, state, host);

            // Redirect to login page with the token
            const loginUrl = `/login?token=${encodeURIComponent(paddedToken)}`;

            // Manually set redirect headers for better proxy compatibility
            res.status(302);
            res.header('Location', loginUrl);
            return res.send();
        } catch (error: unknown) {
            this.logger.error('OIDC callback error:', error);
            return res.status(401).send('Authentication failed');
        }
    }
}
