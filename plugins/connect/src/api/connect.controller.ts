import { Controller, Get, Logger } from '@nestjs/common';
import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';
import { Resource } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { ConnectService } from './connect.service.js';

@Controller('connect')
export class ConnectController {
    protected logger = new Logger(ConnectController.name);

    constructor(private readonly connectService: ConnectService) {}

    @Get('/status')
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT__REMOTE_ACCESS,
        possession: AuthPossession.ANY,
    })
    async getStatus() {
        return this.connectService.getRemoteAccessStatus();
    }
} 