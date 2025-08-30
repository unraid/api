import { Module } from '@nestjs/common';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import { OidcAuthModule } from '@app/unraid-api/graph/resolvers/sso/auth/oidc-auth.module.js';
import { OidcClientModule } from '@app/unraid-api/graph/resolvers/sso/client/oidc-client.module.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/core/oidc-config.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/core/oidc-validation.service.js';
import { OidcService } from '@app/unraid-api/graph/resolvers/sso/core/oidc.service.js';
import { OidcSessionModule } from '@app/unraid-api/graph/resolvers/sso/session/oidc-session.module.js';

@Module({
    imports: [UserSettingsModule, OidcSessionModule, OidcClientModule, OidcAuthModule],
    providers: [OidcService, OidcConfigPersistence, OidcValidationService],
    exports: [OidcService, OidcConfigPersistence, OidcValidationService],
})
export class OidcCoreModule {}
