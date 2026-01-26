import { Module } from '@nestjs/common';

import { AuthModule } from '@app/unraid-api/auth/auth.module.js';
import { ApiConfigModule } from '@app/unraid-api/config/api-config.module.js';
import { OnboardingOverrideModule } from '@app/unraid-api/config/onboarding-override.module.js';
import { OnboardingStateModule } from '@app/unraid-api/config/onboarding-state.module.js';
import { ApiKeyModule } from '@app/unraid-api/graph/resolvers/api-key/api-key.module.js';
import { ApiKeyResolver } from '@app/unraid-api/graph/resolvers/api-key/api-key.resolver.js';
import { ArrayModule } from '@app/unraid-api/graph/resolvers/array/array.module.js';
import { ConfigResolver } from '@app/unraid-api/graph/resolvers/config/config.resolver.js';
import { CustomizationModule } from '@app/unraid-api/graph/resolvers/customization/customization.module.js';
import { DisksModule } from '@app/unraid-api/graph/resolvers/disks/disks.module.js';
import { DisplayResolver } from '@app/unraid-api/graph/resolvers/display/display.resolver.js';
import { DockerModule } from '@app/unraid-api/graph/resolvers/docker/docker.module.js';
import { FlashBackupModule } from '@app/unraid-api/graph/resolvers/flash-backup/flash-backup.module.js';
import { FlashResolver } from '@app/unraid-api/graph/resolvers/flash/flash.resolver.js';
import { InfoModule } from '@app/unraid-api/graph/resolvers/info/info.module.js';
import { LogsModule } from '@app/unraid-api/graph/resolvers/logs/logs.module.js';
import { MetricsModule } from '@app/unraid-api/graph/resolvers/metrics/metrics.module.js';
import { RootMutationsResolver } from '@app/unraid-api/graph/resolvers/mutation/mutation.resolver.js';
import { NotificationsModule } from '@app/unraid-api/graph/resolvers/notifications/notifications.module.js';
import { NotificationsResolver } from '@app/unraid-api/graph/resolvers/notifications/notifications.resolver.js';
import { OnboardingMutationsResolver } from '@app/unraid-api/graph/resolvers/onboarding/onboarding.mutation.js';
import { OnlineResolver } from '@app/unraid-api/graph/resolvers/online/online.resolver.js';
import { OwnerResolver } from '@app/unraid-api/graph/resolvers/owner/owner.resolver.js';
import { RCloneModule } from '@app/unraid-api/graph/resolvers/rclone/rclone.module.js';
import { RegistrationResolver } from '@app/unraid-api/graph/resolvers/registration/registration.resolver.js';
import { ServerResolver } from '@app/unraid-api/graph/resolvers/servers/server.resolver.js';
import { ServerService } from '@app/unraid-api/graph/resolvers/servers/server.service.js';
import { SettingsModule } from '@app/unraid-api/graph/resolvers/settings/settings.module.js';
import { SsoModule } from '@app/unraid-api/graph/resolvers/sso/sso.module.js';
import { SystemTimeModule } from '@app/unraid-api/graph/resolvers/system-time/system-time.module.js';
import { UnraidPluginsModule } from '@app/unraid-api/graph/resolvers/unraid-plugins/unraid-plugins.module.js';
import { UPSModule } from '@app/unraid-api/graph/resolvers/ups/ups.module.js';
import { VarsResolver } from '@app/unraid-api/graph/resolvers/vars/vars.resolver.js';
import { VarsService } from '@app/unraid-api/graph/resolvers/vars/vars.service.js';
import { VmMutationsResolver } from '@app/unraid-api/graph/resolvers/vms/vms.mutations.resolver.js';
import { VmsResolver } from '@app/unraid-api/graph/resolvers/vms/vms.resolver.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';
import { ServicesModule } from '@app/unraid-api/graph/services/services.module.js';
import { ServicesResolver } from '@app/unraid-api/graph/services/services.resolver.js';
import { SharesResolver } from '@app/unraid-api/graph/shares/shares.resolver.js';
import { MeResolver } from '@app/unraid-api/graph/user/user.resolver.js';

@Module({
    imports: [
        ServicesModule,
        ArrayModule,
        ApiKeyModule,
        ApiConfigModule,
        AuthModule,
        CustomizationModule,
        DockerModule,
        DisksModule,
        FlashBackupModule,
        InfoModule,
        LogsModule,
        OnboardingOverrideModule,
        OnboardingStateModule,
        NotificationsModule,
        RCloneModule,
        SettingsModule,
        SsoModule,
        MetricsModule,
        SystemTimeModule,
        UPSModule,
        UnraidPluginsModule,
    ],
    providers: [
        ConfigResolver,
        DisplayResolver,
        FlashResolver,
        MeResolver,
        NotificationsResolver,
        OnlineResolver,
        OwnerResolver,
        OnboardingMutationsResolver,
        RegistrationResolver,
        RootMutationsResolver,
        ServerResolver,
        ServerService,
        ServicesResolver,
        SharesResolver,
        VarsResolver,
        VarsService,
        VmMutationsResolver,
        VmsResolver,
        VmsService,
    ],
    exports: [ApiKeyModule],
})
export class ResolversModule {}
