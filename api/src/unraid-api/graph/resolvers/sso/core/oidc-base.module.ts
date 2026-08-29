import { forwardRef, Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import { OidcClientModule } from '@app/unraid-api/graph/resolvers/sso/client/oidc-client.module.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/core/oidc-config.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/core/oidc-validation.service.js';

// Keep this string token stable for optional plugins without requiring their
// runtime to ship the API's exact @unraid/shared build.
const OIDC_PROVIDER_SOURCE_TOKEN = 'OidcProviderSource';

@Global()
@Module({
    imports: [ConfigModule, UserSettingsModule, forwardRef(() => OidcClientModule)],
    providers: [
        OidcConfigPersistence,
        OidcValidationService,
        { provide: OIDC_PROVIDER_SOURCE_TOKEN, useExisting: OidcConfigPersistence },
    ],
    exports: [OidcConfigPersistence, OidcValidationService, OIDC_PROVIDER_SOURCE_TOKEN],
})
export class OidcBaseModule {}
