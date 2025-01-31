import { Module } from '@nestjs/common';

import { AuthModule } from '@app/unraid-api/auth/auth.module';
import { ApiKeyResolver } from '@app/unraid-api/graph/resolvers/api-key/api-key.resolver';
import { ArrayResolver } from '@app/unraid-api/graph/resolvers/array/array.resolver';
import { CloudResolver } from '@app/unraid-api/graph/resolvers/cloud/cloud.resolver';
import { ConfigResolver } from '@app/unraid-api/graph/resolvers/config/config.resolver';
import { DisksResolver } from '@app/unraid-api/graph/resolvers/disks/disks.resolver';
import { DisplayResolver } from '@app/unraid-api/graph/resolvers/display/display.resolver';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver';
import { FlashResolver } from '@app/unraid-api/graph/resolvers/flash/flash.resolver';
import { InfoResolver } from '@app/unraid-api/graph/resolvers/info/info.resolver';
import { MeResolver } from '@app/unraid-api/graph/resolvers/me/me.resolver';
import { NotificationsResolver } from '@app/unraid-api/graph/resolvers/notifications/notifications.resolver';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service';
import { OnlineResolver } from '@app/unraid-api/graph/resolvers/online/online.resolver';
import { OwnerResolver } from '@app/unraid-api/graph/resolvers/owner/owner.resolver';
import { RegistrationResolver } from '@app/unraid-api/graph/resolvers/registration/registration.resolver';
import { ServerResolver } from '@app/unraid-api/graph/resolvers/servers/server.resolver';
import { VarsResolver } from '@app/unraid-api/graph/resolvers/vars/vars.resolver';
import { VmsResolver } from '@app/unraid-api/graph/resolvers/vms/vms.resolver';

@Module({
    imports: [AuthModule],
    providers: [
        ArrayResolver,
        ApiKeyResolver,
        CloudResolver,
        ConfigResolver,
        DisksResolver,
        DisplayResolver,
        DockerResolver,
        FlashResolver,
        InfoResolver,
        NotificationsResolver,
        OnlineResolver,
        OwnerResolver,
        RegistrationResolver,
        ServerResolver,
        VarsResolver,
        VmsResolver,
        NotificationsService,
        MeResolver,
    ],
    exports: [AuthModule, ApiKeyResolver],
})
export class ResolversModule {}
