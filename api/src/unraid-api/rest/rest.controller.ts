import { Controller, Get, Logger, Param, Res } from '@nestjs/common';

import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import type { FastifyReply } from '@app/types/fastify.js';
import { Resource } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { Public } from '@app/unraid-api/auth/public.decorator.js';
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
}
