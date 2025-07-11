import { Module } from '@nestjs/common';

import { UserSettingsModule } from '@unraid/shared/services/user-settings.js';

import { SsoUserService } from '@app/unraid-api/auth/sso-user.service.js';
import {
    SettingsResolver,
    UnifiedSettingsResolver,
} from '@app/unraid-api/graph/resolvers/settings/settings.resolver.js';
import { ApiSettings } from '@app/unraid-api/graph/resolvers/settings/settings.service.js';

@Module({
    imports: [UserSettingsModule],
    providers: [SettingsResolver, UnifiedSettingsResolver, SsoUserService, ApiSettings],
    exports: [SettingsResolver, UnifiedSettingsResolver, UserSettingsModule, ApiSettings],
})
export class SettingsModule {}
