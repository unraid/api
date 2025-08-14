import { Module } from '@nestjs/common';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import { SsoResolver } from '@app/unraid-api/graph/resolvers/sso/sso.resolver.js';

import '@app/unraid-api/graph/resolvers/sso/sso-settings.types.js';

@Module({
    imports: [UserSettingsModule],
    providers: [SsoResolver, OidcConfigPersistence],
    exports: [OidcConfigPersistence],
})
export class SsoModule {}
