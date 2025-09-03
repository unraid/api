import { Module } from '@nestjs/common';

import { CliServicesModule } from '@app/unraid-api/cli/cli-services.module.js';
import { RCloneModule } from '@app/unraid-api/graph/resolvers/rclone/rclone.module.js';
import { SsoModule } from '@app/unraid-api/graph/resolvers/sso/sso.module.js';
import { RestController } from '@app/unraid-api/rest/rest.controller.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

@Module({
    imports: [RCloneModule, CliServicesModule, SsoModule],
    controllers: [RestController],
    providers: [RestService],
})
export class RestModule {}
