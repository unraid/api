import { CacheModule } from '@nestjs/cache-manager';
import { Module } from '@nestjs/common';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import { OidcAuthService } from '@app/unraid-api/graph/resolvers/sso/oidc-auth.service.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/oidc-session.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/oidc-validation.service.js';
import { SsoResolver } from '@app/unraid-api/graph/resolvers/sso/sso.resolver.js';

import '@app/unraid-api/graph/resolvers/sso/sso-settings.types.js';

@Module({
    imports: [UserSettingsModule, CacheModule.register()],
    providers: [
        SsoResolver,
        OidcConfigPersistence,
        OidcSessionService,
        OidcAuthService,
        OidcValidationService,
    ],
    exports: [OidcConfigPersistence, OidcSessionService, OidcAuthService, OidcValidationService],
})
export class SsoModule {}
