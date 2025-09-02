import { Module } from '@nestjs/common';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/core/oidc-config.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/core/oidc-validation.service.js';

@Module({
    imports: [UserSettingsModule],
    providers: [OidcConfigPersistence, OidcValidationService],
    exports: [OidcConfigPersistence, OidcValidationService],
})
export class OidcBaseModule {}
