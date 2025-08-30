import { Module } from '@nestjs/common';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import { OidcClientConfigService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-client-config.service.js';
import { OidcRedirectUriService } from '@app/unraid-api/graph/resolvers/sso/client/oidc-redirect-uri.service.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/core/oidc-config.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/core/oidc-validation.service.js';

@Module({
    imports: [UserSettingsModule],
    providers: [
        OidcClientConfigService,
        OidcRedirectUriService,
        OidcValidationService,
        OidcConfigPersistence,
    ],
    exports: [OidcClientConfigService, OidcRedirectUriService],
})
export class OidcClientModule {}
