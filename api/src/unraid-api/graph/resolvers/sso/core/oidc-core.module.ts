import { Module } from '@nestjs/common';

import { OidcAuthModule } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-auth.module.js';
import { OidcClientModule } from '@app/unraid-api/graph/resolvers/sso/client/oidc-client.module.js';
import { OidcBaseModule } from '@app/unraid-api/graph/resolvers/sso/core/oidc-base.module.js';
import { OidcService } from '@app/unraid-api/graph/resolvers/sso/core/oidc.service.js';
import { OidcSessionModule } from '@app/unraid-api/graph/resolvers/sso/session/oidc-session.module.js';

@Module({
    imports: [OidcBaseModule, OidcSessionModule, OidcAuthModule, OidcClientModule],
    providers: [OidcService],
    exports: [OidcService, OidcBaseModule, OidcSessionModule, OidcAuthModule, OidcClientModule],
})
export class OidcCoreModule {}
