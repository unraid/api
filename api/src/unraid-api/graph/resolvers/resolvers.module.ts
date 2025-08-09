import { Module } from '@nestjs/common';

import { AuthModule } from '@app/unraid-api/auth/auth.module.js';
import { ApiKeyModule } from '@app/unraid-api/graph/resolvers/api-key/api-key.module.js';
import { ApiKeyResolver } from '@app/unraid-api/graph/resolvers/api-key/api-key.resolver.js';
import { ArrayModule } from '@app/unraid-api/graph/resolvers/array/array.module.js';
import { ConfigResolver } from '@app/unraid-api/graph/resolvers/config/config.resolver.js';
import { CustomizationModule } from '@app/unraid-api/graph/resolvers/customization/customization.module.js';
import { DisksModule } from '@app/unraid-api/graph/resolvers/disks/disks.module.js';
import { DisplayResolver } from '@app/unraid-api/graph/resolvers/display/display.resolver.js';
import { DisplayService } from '@app/unraid-api/graph/resolvers/display/display.service.js';
import { DockerModule } from '@app/unraid-api/graph/resolvers/docker/docker.module.js';
import { FlashBackupModule } from '@app/unraid-api/graph/resolvers/flash-backup/flash-backup.module.js';
import { FlashResolver } from '@app/unraid-api/graph/resolvers/flash/flash.resolver.js';
import { DevicesResolver } from '@app/unraid-api/graph/resolvers/info/devices.resolver.js';
import { DevicesService } from '@app/unraid-api/graph/resolvers/info/devices.service.js';
import { InfoResolver } from '@app/unraid-api/graph/resolvers/info/info.resolver.js';
import { InfoService } from '@app/unraid-api/graph/resolvers/info/info.service.js';
import { LogsResolver } from '@app/unraid-api/graph/resolvers/logs/logs.resolver.js';
import { LogsService } from '@app/unraid-api/graph/resolvers/logs/logs.service.js';
import { RootMutationsResolver } from '@app/unraid-api/graph/resolvers/mutation/mutation.resolver.js';
import { NotificationsResolver } from '@app/unraid-api/graph/resolvers/notifications/notifications.resolver.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';
import { OnlineResolver } from '@app/unraid-api/graph/resolvers/online/online.resolver.js';
import { OwnerResolver } from '@app/unraid-api/graph/resolvers/owner/owner.resolver.js';
import { RCloneModule } from '@app/unraid-api/graph/resolvers/rclone/rclone.module.js';
import { RegistrationResolver } from '@app/unraid-api/graph/resolvers/registration/registration.resolver.js';
import { ServerResolver } from '@app/unraid-api/graph/resolvers/servers/server.resolver.js';
import { SettingsModule } from '@app/unraid-api/graph/resolvers/settings/settings.module.js';
import { SsoModule } from '@app/unraid-api/graph/resolvers/sso/sso.module.js';
import { UPSModule } from '@app/unraid-api/graph/resolvers/ups/ups.module.js';
import { VarsResolver } from '@app/unraid-api/graph/resolvers/vars/vars.resolver.js';
import { VmMutationsResolver } from '@app/unraid-api/graph/resolvers/vms/vms.mutations.resolver.js';
import { VmsResolver } from '@app/unraid-api/graph/resolvers/vms/vms.resolver.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';
import { ServicesResolver } from '@app/unraid-api/graph/services/services.resolver.js';
import { SharesResolver } from '@app/unraid-api/graph/shares/shares.resolver.js';
import { MeResolver } from '@app/unraid-api/graph/user/user.resolver.js';

@Module({
    imports: [
        ArrayModule,
        ApiKeyModule,
        AuthModule,
        CustomizationModule,
        DockerModule,
        DisksModule,
        FlashBackupModule,
        RCloneModule,
        SettingsModule,
        SsoModule,
        UPSModule,
    ],
    providers: [
        ConfigResolver,
        DevicesResolver,
        DevicesService,
        DisplayResolver,
        DisplayService,
        FlashResolver,
        InfoResolver,
        InfoService,
        LogsResolver,
        LogsService,
        MeResolver,
        NotificationsResolver,
        NotificationsService,
        OnlineResolver,
        OwnerResolver,
        RegistrationResolver,
        RootMutationsResolver,
        ServerResolver,
        ServicesResolver,
        SharesResolver,
        VarsResolver,
        VmMutationsResolver,
        VmsResolver,
        VmsService,
    ],
    exports: [ApiKeyModule],
})
export class ResolversModule {}
