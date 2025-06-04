import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigType } from '../model/connect-config.model.js';
import { NetworkService } from './network.service.js';
import { UpnpService } from './upnp.service.js';
import { UrlResolverService } from './url-resolver.service.js';

@Injectable()
export class UpnpRemoteAccessService {
    constructor(
        private readonly upnpService: UpnpService,
        private readonly networkService: NetworkService,
        private readonly configService: ConfigService<ConfigType>,
        private readonly urlResolverService: UrlResolverService
    ) {}

    private readonly logger = new Logger(UpnpRemoteAccessService.name);

    async stop() {
        await this.upnpService.disableUpnp();
        await this.networkService.reloadNetworkStack();
    }

    async begin() {
        const sslPort = this.configService.get<string | undefined>('store.emhttp.var.portssl');
        try {
            await this.upnpService.createOrRenewUpnpLease({
                sslPort: Number(sslPort),
            });
            await this.networkService.reloadNetworkStack();
            return this.urlResolverService.getRemoteAccessUrl();
        } catch (error) {
            this.logger.error(
                'Failed to begin UPNP Remote Access using port %s: %O',
                String(sslPort),
                error
            );
            this.stop();
        }
    }
}
