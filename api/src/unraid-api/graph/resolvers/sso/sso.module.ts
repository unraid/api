import { Module } from '@nestjs/common';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import { OidcAuthService } from '@app/unraid-api/graph/resolvers/sso/oidc-auth.service.js';
import { OidcAuthorizationService } from '@app/unraid-api/graph/resolvers/sso/oidc-authorization.service.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';
import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/oidc-session.service.js';
import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/oidc-state.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/oidc-validation.service.js';
import { SsoResolver } from '@app/unraid-api/graph/resolvers/sso/sso.resolver.js';

import '@app/unraid-api/graph/resolvers/sso/sso-settings.types.js';

@Module({
    imports: [UserSettingsModule],
    providers: [
        SsoResolver,
        OidcConfigPersistence,
        OidcSessionService,
        OidcStateService,
        OidcAuthService,
        OidcValidationService,
        OidcAuthorizationService,
    ],
    exports: [
        OidcConfigPersistence,
        OidcSessionService,
        OidcStateService,
        OidcAuthService,
        OidcValidationService,
        OidcAuthorizationService,
    ],
})
export class SsoModule {}
