import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigType } from '../config.entity.js';
import { NetworkService } from '../system/network.service.js';
import { UpnpService } from '../system/upnp.service.js';

@Injectable()
export class UpnpRemoteAccessService {
    constructor(
        private readonly upnpService: UpnpService,
        private readonly networkService: NetworkService,
        private readonly configService: ConfigService<ConfigType>
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
