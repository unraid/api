import { All, Controller, Get, Logger, Param, Req, Res } from '@nestjs/common';

import got from 'got';
import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { FastifyReply, FastifyRequest } from '@app/unraid-api/types/fastify.js';
import { Public } from '@app/unraid-api/auth/public.decorator.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

@Controller()
export class RestController {
    protected logger = new Logger(RestController.name);
    constructor(private readonly restService: RestService) {}

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
    /*
    @All('/graphql/api/rclone-webgui/*')
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.FLASH,
        possession: AuthPossession.ANY,
    })
    async proxyRcloneWebGui(@Req() req: FastifyRequest, @Res() res: FastifyReply) {
        try {
            const rcloneDetails = await this.flashBackupService.serveWebGui();
            const path = req.url.replace('/graphql/api/rclone-webgui/', '');
            const targetUrl = `${rcloneDetails.url}${path}`;

            this.logger.debug(`Proxying request to: ${targetUrl}`);

            // Forward the request to the RClone service
            const method = req.method.toLowerCase();
            const options = {
                headers: {
                    ...req.headers,
                    Authorization: `Basic ${Buffer.from(`${rcloneDetails.username}:${rcloneDetails.password}`).toString('base64')}`,
                },
                body: req.body,
                responseType: 'buffer',
                enableUnixSockets: true,
            };

            const response = await got[method](targetUrl, options);

            // Forward the response back to the client
            return res
                .status(response.statusCode)
                .headers(response.headers)
                .send(response.body);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error proxying to RClone WebGUI: ${errorMessage}`);
            return res.status(500).send(`Error: Failed to proxy to RClone WebGUI`);
        }
    }
        */
}
