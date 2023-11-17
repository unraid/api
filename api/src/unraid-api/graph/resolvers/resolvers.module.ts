import { ArrayResolver } from '@app/unraid-api/graph/resolvers/array/array.resolver';
import { Module } from '@nestjs/common';
import { CloudResolver } from './cloud/cloud.resolver';
import { ConfigResolver } from './config/config.resolver';
import { DisksResolver } from './disks/disks.resolver';
import { DockerContainersResolver } from './docker-containers/docker-containers.resolver';
import { DisplayResolver } from './display/display.resolver';
import { NotificationsResolver } from './notifications/notifications.resolver';
import { OnlineResolver } from './online/online.resolver';
import { InfoResolver } from './info/info.resolver';
import { VmsResolver } from './vms/vms.resolver';
import { FlashResolver } from './flash/flash.resolver';
import { OwnerResolver } from './owner/owner.resolver';
import { RegistrationResolver } from './registration/registration.resolver';
import { ServerResolver } from './servers/server.resolver';

@Module({
    providers: [
        ArrayResolver,
        CloudResolver,
        ConfigResolver,
        DisksResolver,
        DockerContainersResolver,
        DisplayResolver,
        NotificationsResolver,
        OnlineResolver,
        InfoResolver,
        VmsResolver,
        FlashResolver,
        OwnerResolver,
        RegistrationResolver,
        ServerResolver,
    ],
})
export class ResolversModule {}
