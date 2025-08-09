import type { OidcConfig } from '@app/unraid-api/graph/resolvers/sso/oidc-config.service.js';

declare module '@unraid/shared/services/user-settings.js' {
    interface UserSettings {
        sso: OidcConfig;
    }
}
