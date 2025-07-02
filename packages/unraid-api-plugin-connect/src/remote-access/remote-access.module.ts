import { Module } from '@nestjs/common';

import { WanAccessEventHandler } from '../event-handler/wan-access.events.js';
import { DynamicRemoteAccessService } from './dynamic-remote-access.service.js';
import { StaticRemoteAccessService } from './static-remote-access.service.js';
import { UpnpRemoteAccessService } from './upnp-remote-access.service.js';
import { NetworkModule } from '../network/network.module.js';

@Module({
    imports: [NetworkModule],
    providers: [
        DynamicRemoteAccessService,
        StaticRemoteAccessService,
        UpnpRemoteAccessService,
        WanAccessEventHandler,
    ],
    exports: [DynamicRemoteAccessService, NetworkModule],
})
export class RemoteAccessModule {}
