import { Module } from '@nestjs/common';

import { NetworkResolver } from '../remote-access/network.resolver.js';
import { DnsService } from './dns.service.js';
import { NetworkService } from './network.service.js';
import { NginxService } from './nginx.service.js';
import { UpnpService } from './upnp.service.js';
import { UrlResolverService } from './url-resolver.service.js';
import { ConnectConfigService } from '../connect/connect-config.service.js';
import { ConfigModule } from '@nestjs/config';

@Module({
    imports: [ConfigModule],
    providers: [
        NetworkService,
        NetworkResolver,
        UpnpService,
        UrlResolverService,
        DnsService,
        NginxService,
        ConnectConfigService,
    ],
    exports: [
        NetworkService,
        NetworkResolver,
        UpnpService,
        UrlResolverService,
        DnsService,
        NginxService,
        ConnectConfigService,
    ],
})
export class SystemModule {}
