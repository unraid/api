import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { ConnectConfigService } from '../config/connect.config.service.js';
import { NetworkResolver } from './network.resolver.js';
import { DnsService } from './dns.service.js';
import { NetworkService } from './network.service.js';
import { UpnpService } from './upnp.service.js';
import { UrlResolverService } from './url-resolver.service.js';

@Module({
    imports: [ConfigModule],
    providers: [
        NetworkService,
        NetworkResolver,
        UpnpService,
        UrlResolverService,
        DnsService,
        ConnectConfigService,
    ],
    exports: [
        NetworkService,
        NetworkResolver,
        UpnpService,
        UrlResolverService,
        DnsService,
        ConnectConfigService,
    ],
})
export class NetworkModule {}
