import { Module } from '@nestjs/common';

import { AuthModule } from '@app/unraid-api/auth/auth.module.js';
import { ConnectSettingsService } from '@app/unraid-api/graph/connect/connect-settings.service.js';
import { ConnectResolver } from '@app/unraid-api/graph/connect/connect.resolver.js';
import { ConnectService } from '@app/unraid-api/graph/connect/connect.service.js';
import { NetworkResolver } from '@app/unraid-api/graph/network/network.resolver.js';
import { ApiKeyResolver } from '@app/unraid-api/graph/resolvers/api-key/api-key.resolver.js';
import { ArrayMutationsResolver } from '@app/unraid-api/graph/resolvers/array/array.mutations.resolver.js';
import { ArrayResolver } from '@app/unraid-api/graph/resolvers/array/array.resolver.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { CloudResolver } from '@app/unraid-api/graph/resolvers/cloud/cloud.resolver.js';
import { ConfigResolver } from '@app/unraid-api/graph/resolvers/config/config.resolver.js';
import { DisksResolver } from '@app/unraid-api/graph/resolvers/disks/disks.resolver.js';
import { DisplayResolver } from '@app/unraid-api/graph/resolvers/display/display.resolver.js';
import { DockerMutationsResolver } from '@app/unraid-api/graph/resolvers/docker/docker.mutations.resolver.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { DockerService } from '@app/unraid-api/graph/resolvers/docker/docker.service.js';
import { FlashResolver } from '@app/unraid-api/graph/resolvers/flash/flash.resolver.js';
import { InfoResolver } from '@app/unraid-api/graph/resolvers/info/info.resolver.js';
import { LogsResolver } from '@app/unraid-api/graph/resolvers/logs/logs.resolver.js';
import { LogsService } from '@app/unraid-api/graph/resolvers/logs/logs.service.js';
import { MeResolver } from '@app/unraid-api/graph/resolvers/me/me.resolver.js';
import { MutationResolver } from '@app/unraid-api/graph/resolvers/mutation/mutation.resolver.js';
import { NotificationsResolver } from '@app/unraid-api/graph/resolvers/notifications/notifications.resolver.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';
import { OnlineResolver } from '@app/unraid-api/graph/resolvers/online/online.resolver.js';
import { OwnerResolver } from '@app/unraid-api/graph/resolvers/owner/owner.resolver.js';
import { RegistrationResolver } from '@app/unraid-api/graph/resolvers/registration/registration.resolver.js';
import { ServerResolver } from '@app/unraid-api/graph/resolvers/servers/server.resolver.js';
import { VarsResolver } from '@app/unraid-api/graph/resolvers/vars/vars.resolver.js';
import { VmMutationsResolver } from '@app/unraid-api/graph/resolvers/vms/vms.mutations.resolver.js';
import { VmsResolver } from '@app/unraid-api/graph/resolvers/vms/vms.resolver.js';
import { VmsService } from '@app/unraid-api/graph/resolvers/vms/vms.service.js';
import { ServicesResolver } from '@app/unraid-api/graph/services/services.resolver.js';
import { SharesResolver } from '@app/unraid-api/graph/shares/shares.resolver.js';

@Module({
    imports: [AuthModule],
    providers: [
        ApiKeyResolver,
        ArrayMutationsResolver,
        ArrayResolver,
        ArrayService,
        CloudResolver,
        ConfigResolver,
        ConnectResolver,
        ConnectService,
        ConnectSettingsService,
        DisksResolver,
        DisplayResolver,
        DockerMutationsResolver,
        DockerResolver,
        DockerService,
        FlashResolver,
        InfoResolver,
        LogsResolver,
        LogsService,
        MeResolver,
        MutationResolver,
        NetworkResolver,
        NotificationsResolver,
        NotificationsService,
        OnlineResolver,
        OwnerResolver,
        RegistrationResolver,
        ServerResolver,
        ServicesResolver,
        SharesResolver,
        VarsResolver,
        VmMutationsResolver,
        VmsResolver,
        VmsService,
    ],
    exports: [AuthModule, ApiKeyResolver],
})
export class ResolversModule {}
