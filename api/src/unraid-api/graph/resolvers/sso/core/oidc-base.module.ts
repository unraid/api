import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import { OidcClientModule } from '@app/unraid-api/graph/resolvers/sso/client/oidc-client.module.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/core/oidc-config.service.js';
import { OidcValidationService } from '@app/unraid-api/graph/resolvers/sso/core/oidc-validation.service.js';

@Module({
    imports: [ConfigModule, UserSettingsModule, forwardRef(() => OidcClientModule)],
    providers: [OidcConfigPersistence, OidcValidationService],
    exports: [OidcConfigPersistence, OidcValidationService],
})
export class OidcBaseModule {}
