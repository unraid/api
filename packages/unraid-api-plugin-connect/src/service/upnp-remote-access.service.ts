import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EVENTS } from '../helper/nest-tokens.js';
import { ConfigType } from '../model/connect-config.model.js';
import { UpnpService } from './upnp.service.js';
import { UrlResolverService } from './url-resolver.service.js';

@Injectable()
export class UpnpRemoteAccessService {
    constructor(
        private readonly upnpService: UpnpService,
        private readonly configService: ConfigService<ConfigType>,
        private readonly urlResolverService: UrlResolverService,
        private readonly eventEmitter: EventEmitter2
    ) {}

    private readonly logger = new Logger(UpnpRemoteAccessService.name);

    async stop() {
        await this.upnpService.disableUpnp();
        this.eventEmitter.emit(EVENTS.DISABLE_WAN_ACCESS);
    }

    async begin() {
        const sslPort = this.configService.get<string | undefined>('store.emhttp.var.portssl');
        if (!sslPort || isNaN(Number(sslPort))) {
            throw new Error(`Invalid SSL port configuration: ${sslPort}`);
        }
        try {
            await this.upnpService.createOrRenewUpnpLease({
                sslPort: Number(sslPort),
            });
            this.eventEmitter.emit(EVENTS.ENABLE_WAN_ACCESS);
            return this.urlResolverService.getRemoteAccessUrl();
        } catch (error) {
            this.logger.error(
                'Failed to begin UPNP Remote Access using port %s: %O',
                String(sslPort),
                error
            );
            await this.stop();
        }
    }
}
