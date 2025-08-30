import { Module } from '@nestjs/common';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import { OidcAuthorizationService } from '@app/unraid-api/graph/resolvers/sso/oidc-authorization.service.js';
import { OidcClaimsService } from '@app/unraid-api/graph/resolvers/sso/oidc-claims.service.js';
import { OidcClientConfigService } from '@app/unraid-api/graph/resolvers/sso/oidc-client-config.service.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import { OidcRedirectUriService } from '@app/unraid-api/graph/resolvers/sso/oidc-redirect-uri.service.js';
import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/oidc-session.service.js';
import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/oidc-state.service.js';
import { OidcTokenExchangeService } from '@app/unraid-api/graph/resolvers/sso/oidc-token-exchange.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/oidc-validation.service.js';
import { OidcService } from '@app/unraid-api/graph/resolvers/sso/oidc.service.js';
import { SsoResolver } from '@app/unraid-api/graph/resolvers/sso/sso.resolver.js';

import '@app/unraid-api/graph/resolvers/sso/sso-settings.types.js';

@Module({
    imports: [UserSettingsModule],
    providers: [
        SsoResolver,
        OidcConfigPersistence,
        OidcSessionService,
        OidcStateService,
        OidcService,
        OidcValidationService,
        OidcAuthorizationService,
        OidcRedirectUriService,
        OidcClientConfigService,
        OidcTokenExchangeService,
        OidcClaimsService,
    ],
    exports: [
        OidcConfigPersistence,
        OidcSessionService,
        OidcStateService,
        OidcService,
        OidcValidationService,
        OidcAuthorizationService,
        OidcRedirectUriService,
        OidcClientConfigService,
        OidcTokenExchangeService,
        OidcClaimsService,
    ],
})
export class SsoModule {}
