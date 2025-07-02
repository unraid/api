import { Module } from '@nestjs/common';

import { NetworkModule } from '../network/network.module.js';
import { WanAccessEventHandler } from '../network/wan-access.events.js';
import { DynamicRemoteAccessService } from './dynamic-remote-access.service.js';
import { StaticRemoteAccessService } from './static-remote-access.service.js';
import { UpnpRemoteAccessService } from './upnp-remote-access.service.js';

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
