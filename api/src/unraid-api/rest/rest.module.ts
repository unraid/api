import { RestController } from '@app/unraid-api/rest/rest.controller';
import { Module } from '@nestjs/common';
import { RestService } from './rest.service';

@Module({
    imports: [],
    controllers: [RestController],
    providers: [RestService],
})
export class RestModule {}
