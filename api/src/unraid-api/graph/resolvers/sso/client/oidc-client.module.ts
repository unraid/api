import { Module } from '@nestjs/common';

import { OidcClientConfigService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-client-config.service.js';
import { OidcRedirectUriService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-redirect-uri.service.js';
import { OidcBaseModule } from '@app/unraid-api/graph/resolvers/sso/core/oidc-base.module.js';

@Module({
    imports: [OidcBaseModule],
    providers: [OidcClientConfigService, OidcRedirectUriService],
    exports: [OidcClientConfigService, OidcRedirectUriService],
})
export class OidcClientModule {}
