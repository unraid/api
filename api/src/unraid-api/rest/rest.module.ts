import { Module } from '@nestjs/common';

import { RestController } from '@app/unraid-api/rest/rest.controller';
import { RestService } from '@app/unraid-api/rest/rest.service';

@Module({
    imports: [],
    controllers: [RestController],
    providers: [RestService],
})
export class RestModule {}
