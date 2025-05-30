import { Module } from '@nestjs/common';

import { SystemModule } from '../system/system.module.js';
import { DynamicRemoteAccessService } from './dynamic-remote-access.service.js';
import { StaticRemoteAccessService } from './static-remote-access.service.js';
import { UpnpRemoteAccessService } from './upnp-remote-access.service.js';

@Module({
    imports: [SystemModule],
    providers: [DynamicRemoteAccessService, StaticRemoteAccessService, UpnpRemoteAccessService],
    exports: [DynamicRemoteAccessService, SystemModule],
})
export class RemoteAccessModule {}
