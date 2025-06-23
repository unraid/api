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
        this.logger.verbose('Begin UPNP Remote Access');
        const { httpsPort, httpPort } = this.configService.getOrThrow('store.emhttp.nginx');
        const localPort = Number(httpPort || httpsPort);
        if (isNaN(localPort)) {
            throw new Error(`Invalid local port configuration: ${localPort}`);
        }
        try {
            const mapping = await this.upnpService.createOrRenewUpnpLease({
                sslPort: localPort,
            });
            this.configService.set('connect.config.wanport', mapping.publicPort);
            this.eventEmitter.emit(EVENTS.ENABLE_WAN_ACCESS);
            return this.urlResolverService.getRemoteAccessUrl();
        } catch (error) {
            this.logger.error(error, 'Failed to begin UPNP Remote Access');
            await this.stop();
        }
    }
}
