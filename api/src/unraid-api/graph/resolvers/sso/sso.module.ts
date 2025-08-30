import { Module } from '@nestjs/common';

import { OidcAuthModule } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-auth.module.js';
import { OidcClientModule } from '@app/unraid-api/graph/resolvers/sso/client/oidc-client.module.js';
import { OidcCoreModule } from '@app/unraid-api/graph/resolvers/sso/core/oidc-core.module.js';
import { OidcSessionModule } from '@app/unraid-api/graph/resolvers/sso/session/oidc-session.module.js';
import { SsoResolver } from '@app/unraid-api/graph/resolvers/sso/sso.resolver.js';

import '@app/unraid-api/graph/resolvers/sso/models/sso-settings.types.js';

@Module({
    imports: [OidcCoreModule, OidcAuthModule, OidcSessionModule, OidcClientModule],
    providers: [SsoResolver],
    exports: [OidcCoreModule, OidcAuthModule, OidcSessionModule, OidcClientModule],
})
export class SsoModule {}
