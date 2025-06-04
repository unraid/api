import { Module } from '@nestjs/common';

import { SystemModule } from './system.module.js';
import { DynamicRemoteAccessService } from '../service/dynamic-remote-access.service.js';
import { StaticRemoteAccessService } from '../service/static-remote-access.service.js';
import { UpnpRemoteAccessService } from '../service/upnp-remote-access.service.js';

@Module({
    imports: [SystemModule],
    providers: [DynamicRemoteAccessService, StaticRemoteAccessService, UpnpRemoteAccessService],
    exports: [DynamicRemoteAccessService, SystemModule],
})
export class RemoteAccessModule {}
