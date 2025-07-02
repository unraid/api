import { Module } from '@nestjs/common';

import { WanAccessEventHandler } from '../event-handler/wan-access.events.js';
import { DynamicRemoteAccessService } from './dynamic-remote-access.service.js';
import { StaticRemoteAccessService } from './static-remote-access.service.js';
import { UpnpRemoteAccessService } from './upnp-remote-access.service.js';
import { SystemModule } from '../module/system.module.js';

@Module({
    imports: [SystemModule],
    providers: [
        DynamicRemoteAccessService,
        StaticRemoteAccessService,
        UpnpRemoteAccessService,
        WanAccessEventHandler,
    ],
    exports: [DynamicRemoteAccessService, SystemModule],
})
export class RemoteAccessModule {}
