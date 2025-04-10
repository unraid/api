import { AuthModule } from '@app/unraid-api/auth/auth.module.js';
import { ConnectSettingsResolver } from '@app/unraid-api/graph/resolvers/connect/connect-settings.resolver.js';
import { ConnectSettingsService } from '@app/unraid-api/graph/resolvers/connect/connect-settings.service.js';
import { ConnectResolver } from '@app/unraid-api/graph/resolvers/connect/connect.resolver.js';
import { Module } from '@nestjs/common';

@Module({
    imports: [AuthModule],
    providers: [ConnectResolver, ConnectSettingsResolver, ConnectSettingsService],
})
export class ConnectModule {}