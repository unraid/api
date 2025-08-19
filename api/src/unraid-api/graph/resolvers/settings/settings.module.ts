import { Module } from '@nestjs/common';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import {
    SettingsResolver,
    SsoSettingsResolver,
    UnifiedSettingsResolver,
} from '@app/unraid-api/graph/resolvers/settings/settings.resolver.js';
import { ApiSettings } from '@app/unraid-api/graph/resolvers/settings/settings.service.js';
import { SsoModule } from '@app/unraid-api/graph/resolvers/sso/sso.module.js';
import { UnraidFileModifierModule } from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.module.js';

@Module({
    imports: [UserSettingsModule, UnraidFileModifierModule, SsoModule],
    providers: [SettingsResolver, UnifiedSettingsResolver, SsoSettingsResolver, ApiSettings],
    exports: [
        SettingsResolver,
        UnifiedSettingsResolver,
        SsoSettingsResolver,
        UserSettingsModule,
        ApiSettings,
    ],
})
export class SettingsModule {}
