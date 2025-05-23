import { Module } from '@nestjs/common';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AuthModule } from '@app/unraid-api/auth/auth.module.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { ApiKeyMutationsResolver } from '@app/unraid-api/graph/resolvers/api-key/api-key.mutation.js';
import { ApiKeyResolver } from '@app/unraid-api/graph/resolvers/api-key/api-key.resolver.js';

@Module({
    imports: [AuthModule],
    providers: [ApiKeyResolver, ApiKeyService, AuthService, ApiKeyMutationsResolver],
    exports: [ApiKeyResolver, ApiKeyService],
})
export class ApiKeyModule {}
