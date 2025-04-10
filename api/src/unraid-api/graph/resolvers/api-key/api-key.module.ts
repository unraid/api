import { Module } from '@nestjs/common';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { ApiKeyResolver } from '@app/unraid-api/graph/resolvers/api-key/api-key.resolver.js';

@Module({
    providers: [ApiKeyResolver, ApiKeyService, AuthService],
    exports: [ApiKeyResolver],
})
export class ApiKeyModule {}
