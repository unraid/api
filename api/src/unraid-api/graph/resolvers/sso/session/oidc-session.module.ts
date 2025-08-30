import { Module } from '@nestjs/common';

import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/session/oidc-session.service.js';
import { OidcStateService } from '@app/unraid-api/graph/resolvers/sso/session/oidc-state.service.js';

@Module({
    providers: [OidcSessionService, OidcStateService],
    exports: [OidcSessionService, OidcStateService],
})
export class OidcSessionModule {}
