import { ApiKeyService } from '@app/unraid-api/api-key/api-key.service';
import { Module } from '@nestjs/common';

@Module({
    providers: [ApiKeyService],
    exports: [ApiKeyService],
})
export class ApiKeyModule {}
