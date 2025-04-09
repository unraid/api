import { Module } from '@nestjs/common';
import { ApiKeyResolver } from './api-key.resolver.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';

@Module({
  providers: [ApiKeyResolver, ApiKeyService, AuthService],
  exports: [ApiKeyResolver],
})
export class ApiKeyModule {} 