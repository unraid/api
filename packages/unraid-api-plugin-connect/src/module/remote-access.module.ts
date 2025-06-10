import { Module } from '@nestjs/common';

import { WanAccessEventHandler } from '../event-handler/wan-access.handler.js';
import { DynamicRemoteAccessService } from '../service/dynamic-remote-access.service.js';
import { StaticRemoteAccessService } from '../service/static-remote-access.service.js';
import { UpnpRemoteAccessService } from '../service/upnp-remote-access.service.js';
import { SystemModule } from './system.module.js';

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
