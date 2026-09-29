import { Module } from '@nestjs/common';

import { FastifyThrottlerGuard } from '@app/unraid-api/auth/fastify-throttler.guard.js';
import { RCloneModule } from '@app/unraid-api/graph/resolvers/rclone/rclone.module.js';
import { SsoModule } from '@app/unraid-api/graph/resolvers/sso/sso.module.js';
import { RestController } from '@app/unraid-api/rest/rest.controller.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

@Module({
    imports: [RCloneModule, SsoModule],
    controllers: [RestController],
    providers: [RestService, FastifyThrottlerGuard],
})
export class RestModule {}
