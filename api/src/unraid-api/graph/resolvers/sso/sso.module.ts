import { Module } from '@nestjs/common';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import { OidcAuthService } from '@app/unraid-api/graph/resolvers/sso/oidc-auth.service.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/oidc-session.service.js';
import { SsoResolver } from '@app/unraid-api/graph/resolvers/sso/sso.resolver.js';

import '@app/unraid-api/graph/resolvers/sso/sso-settings.types.js';

@Module({
    imports: [UserSettingsModule],
    providers: [SsoResolver, OidcConfigPersistence, OidcSessionService, OidcAuthService],
    exports: [OidcConfigPersistence, OidcSessionService, OidcAuthService],
})
export class SsoModule {}
