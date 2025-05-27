import { Module } from '@nestjs/common';

import { DnsService } from './dns.service.js';
import { NetworkService } from './network.service.js';
import { NginxService } from './nginx.service.js';
import { UpnpService } from './upnp.service.js';
import { UrlResolverService } from './url-resolver.service.js';

@Module({
    providers: [NetworkService, UpnpService, UrlResolverService, DnsService, NginxService],
    exports: [NetworkService, UpnpService, UrlResolverService, DnsService, NginxService],
})
export class SystemModule {}
