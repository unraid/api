import { Module } from '@nestjs/common';

import { AuthModule } from '@app/unraid-api/auth/auth.module.js';
import { ApiKeyResolver } from '@app/unraid-api/graph/resolvers/api-key/api-key.resolver.js';
import { ArrayModule } from '@app/unraid-api/graph/resolvers/array/array.module.js';
import { ArrayMutationsResolver } from '@app/unraid-api/graph/resolvers/array/array.mutations.resolver.js';
import { ArrayResolver } from '@app/unraid-api/graph/resolvers/array/array.resolver.js';
import { ArrayService } from '@app/unraid-api/graph/resolvers/array/array.service.js';
import { CloudResolver } from '@app/unraid-api/graph/resolvers/cloud/cloud.resolver.js';
import { ConfigResolver } from '@app/unraid-api/graph/resolvers/config/config.resolver.js';
import { ConnectModule } from '@app/unraid-api/graph/resolvers/connect/connect.module.js';
import { CustomizationModule } from '@app/unraid-api/graph/resolvers/customization/customization.module.js';
import { DisksModule } from '@app/unraid-api/graph/resolvers/disks/disks.module.js';
import { DisplayResolver } from '@app/unraid-api/graph/resolvers/display/display.resolver.js';
import { DockerModule } from '@app/unraid-api/graph/resolvers/docker/docker.module.js';
import { FlashResolver } from '@app/unraid-api/graph/resolvers/flash/flash.resolver.js';
import { InfoResolver } from '@app/unraid-api/graph/resolvers/info/info.resolver.js';
import { LogsResolver } from '@app/unraid-api/graph/resolvers/logs/logs.resolver.js';
import { LogsService } from '@app/unraid-api/graph/resolvers/logs/logs.service.js';
import { LxcResolver } from '@app/unraid-api/graph/resolvers/lxc/lxc.resolver.js';
import { LxcService } from '@app/unraid-api/graph/resolvers/lxc/lxc.service.js';
import { RootMutationsResolver } from '@app/unraid-api/graph/resolvers/mutation/mutation.resolver.js';
import { NetworkResolver } from '@app/unraid-api/graph/resolvers/network/network.resolver.js';
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
import { MeResolver } from '@app/unraid-api/graph/user/user.resolver.js';

@Module({
    imports: [ArrayModule, AuthModule, ConnectModule, CustomizationModule, DockerModule, DisksModule],
    providers: [
        ApiKeyResolver,
        CloudResolver,
        ConfigResolver,
        DisplayResolver,
        FlashResolver,
        InfoResolver,
        LogsResolver,
        LogsService,
        MeResolver,
        NetworkResolver,
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
        LxcResolver,
        LxcService,
    ],
    exports: [AuthModule, ApiKeyResolver],
})
export class ResolversModule {}
