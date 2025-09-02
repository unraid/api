import { Module } from '@nestjs/common';

import { OidcAuthorizationService } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-authorization.service.js';
import { OidcClaimsService } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-claims.service.js';
import { OidcTokenExchangeService } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-token-exchange.service.js';

@Module({
    providers: [OidcAuthorizationService, OidcTokenExchangeService, OidcClaimsService],
    exports: [OidcAuthorizationService, OidcTokenExchangeService, OidcClaimsService],
})
export class OidcAuthModule {}
