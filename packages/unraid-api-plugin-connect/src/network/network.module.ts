import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConnectConfigService } from '../config/connect.config.service.js';
import { DnsService } from './dns.service.js';
import { NetworkResolver } from './network.resolver.js';
import { NetworkService } from './network.service.js';
import { UpnpService } from './upnp.service.js';
import { UrlResolverService } from './url-resolver.service.js';

@Module({
    imports: [ConfigModule],
    providers: [
        UpnpService,
        NetworkService,
        NetworkResolver,
        UrlResolverService,
        DnsService,
        ConnectConfigService,
    ],
    exports: [
        UpnpService,
        NetworkService,
        NetworkResolver,
        UrlResolverService,
        DnsService,
        ConnectConfigService,
    ],
})
export class NetworkModule {}
