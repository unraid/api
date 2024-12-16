import { Module } from '@nestjs/common';

import { AuthModule } from '@app/unraid-api/auth/auth.module';
import { ArrayResolver } from '@app/unraid-api/graph/resolvers/array/array.resolver';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver';

import { AuthResolver } from './auth/auth.resolver';
import { CloudResolver } from './cloud/cloud.resolver';
import { ConfigResolver } from './config/config.resolver';
import { DisksResolver } from './disks/disks.resolver';
import { DisplayResolver } from './display/display.resolver';
import { FlashResolver } from './flash/flash.resolver';
import { InfoResolver } from './info/info.resolver';
import { NotificationsResolver } from './notifications/notifications.resolver';
import { NotificationsService } from './notifications/notifications.service';
import { OnlineResolver } from './online/online.resolver';
import { OwnerResolver } from './owner/owner.resolver';
import { RegistrationResolver } from './registration/registration.resolver';
import { ServerResolver } from './servers/server.resolver';
import { VarsResolver } from './vars/vars.resolver';
import { VmsResolver } from './vms/vms.resolver';

@Module({
    imports: [AuthModule],
    providers: [
        ArrayResolver,
        AuthResolver,
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
    ],
    exports: [AuthModule, AuthResolver],
})
export class ResolversModule {}
