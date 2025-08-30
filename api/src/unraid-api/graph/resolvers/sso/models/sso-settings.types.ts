import type { OidcConfig } from '@app/unraid-api/graph/resolvers/sso/core/oidc-config.service.js';

declare module '@unraid/shared/services/user-settings.js' {
    interface UserSettings {
        sso: OidcConfig;
    }
}
