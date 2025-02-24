import { Module } from '@nestjs/common';

import { RestController } from '@app/unraid-api/rest/rest.controller.js';
import { RestService } from '@app/unraid-api/rest/rest.service.js';

@Module({
    imports: [],
    controllers: [RestController],
    providers: [RestService],
})
export class RestModule {}
