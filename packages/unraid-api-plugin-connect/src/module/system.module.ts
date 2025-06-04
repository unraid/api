import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConnectConfigService } from '../service/connect-config.service.js';
import { NetworkResolver } from '../resolver/network.resolver.js';
import { DnsService } from '../service/dns.service.js';
import { NetworkService } from '../service/network.service.js';
import { NginxService } from '../service/nginx.service.js';
import { UpnpService } from '../service/upnp.service.js';
import { UrlResolverService } from '../service/url-resolver.service.js';

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
