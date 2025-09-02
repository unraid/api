import { Module } from '@nestjs/common';

import { OidcCoreModule } from '@app/unraid-api/graph/resolvers/sso/core/oidc-core.module.js';
import { SsoResolver } from '@app/unraid-api/graph/resolvers/sso/sso.resolver.js';

import '@app/unraid-api/graph/resolvers/sso/models/sso-settings.types.js';

@Module({
    imports: [OidcCoreModule],
    providers: [SsoResolver],
    exports: [OidcCoreModule],
})
export class SsoModule {}
