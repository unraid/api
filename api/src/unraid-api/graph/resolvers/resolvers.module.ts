import { ArrayResolver } from '@app/unraid-api/graph/resolvers/array/array.resolver';
import { Module } from '@nestjs/common';
import { CloudResolver } from './cloud/cloud.resolver';
import { ConfigResolver } from './config/config.resolver';
import { DisksResolver } from './disks/disks.resolver';
import { DisplayResolver } from './display/display.resolver';
import { NotificationsResolver } from './notifications/notifications.resolver';
import { OnlineResolver } from './online/online.resolver';
import { InfoResolver } from './info/info.resolver';
import { VmsResolver } from './vms/vms.resolver';
import { FlashResolver } from './flash/flash.resolver';
import { OwnerResolver } from './owner/owner.resolver';
import { RegistrationResolver } from './registration/registration.resolver';
import { ServerResolver } from './servers/server.resolver';
import { VarsResolver } from './vars/vars.resolver';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver';
import { NotificationsService } from './notifications/notifications.service';

@Module({
    providers: [
        ArrayResolver,
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
})
export class ResolversModule {}
