import { Module } from '@nestjs/common';

import { RestController } from '@app/unraid-api/rest/rest.controller.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';
import { RCloneModule } from '@app/unraid-api/graph/resolvers/rclone/rclone.module.js';
@Module({
    imports: [RCloneModule],
    controllers: [RestController],
    providers: [RestService],
})
export class RestModule {}
