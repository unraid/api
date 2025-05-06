import { Injectable } from '@nestjs/common';

import { DnsService } from './dns.service.js';
import { NginxService } from './nginx.service.js';

@Injectable()
export class NetworkService {
    constructor(
        private readonly nginxService: NginxService,
        private readonly dnsService: DnsService
    ) {}

    async reloadNetworkStack() {
        await this.nginxService.reload();
        await this.dnsService.update();
    }
}
