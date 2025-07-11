import { Inject, Injectable } from '@nestjs/common';

import { NginxService } from '@unraid/shared/services/nginx.js';
import { NGINX_SERVICE_TOKEN } from '@unraid/shared/tokens.js';

import { ConnectConfigService } from '../config/connect.config.service.js';
import { DnsService } from './dns.service.js';
import { UrlResolverService } from './url-resolver.service.js';

@Injectable()
export class NetworkService {
    constructor(
        @Inject(NGINX_SERVICE_TOKEN)
        private readonly nginxService: NginxService,
        private readonly dnsService: DnsService,
        private readonly urlResolverService: UrlResolverService,
        private readonly connectConfigService: ConnectConfigService
    ) {}

    async reloadNetworkStack() {
        await this.nginxService.reload();
        await this.dnsService.update();
    }

    /**
     * Returns the set of origins allowed to access the Unraid API
     */
    getAllowedOrigins(): string[] {
        const sink = [
            ...this.urlResolverService.getAllowedLocalAccessUrls(),
            ...this.urlResolverService.getAllowedServerIps(),
            ...this.connectConfigService.getExtraOrigins(),
            ...this.connectConfigService.getSandboxOrigins(),
            /**----------------------
             *    Connect Origins
             *------------------------**/
            'https://connect.myunraid.net',
            'https://connect-staging.myunraid.net',
            'https://dev-my.myunraid.net:4000',
            /**----------------------
             *    Allowed Sockets
             *------------------------**/
            '/var/run/unraid-notifications.sock', // Notifier bridge
            '/var/run/unraid-php.sock', // Unraid PHP scripts
            '/var/run/unraid-cli.sock', // CLI
        ].map((origin) => (origin.endsWith('/') ? origin.slice(0, -1) : origin));
        return [...new Set(sink)];
    }
}
