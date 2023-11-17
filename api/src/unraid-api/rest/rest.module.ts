import { RestController } from '@app/unraid-api/rest/rest.controller';
import { Module } from '@nestjs/common';

@Module({
    imports: [],
    controllers: [RestController],
    providers: [],
})
export class RestModule {}
