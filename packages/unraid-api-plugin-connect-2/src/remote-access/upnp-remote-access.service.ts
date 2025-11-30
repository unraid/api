import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ConfigType } from '../config/connect.config.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { UpnpService } from '../network/upnp.service.js';
import { UrlResolverService } from '../network/url-resolver.service.js';

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
        this.logger.log('Begin UPNP Remote Access');
        const { httpsPort, httpPort, sslMode } = this.configService.getOrThrow('store.emhttp.nginx');
        const localPort = sslMode === 'no' ? Number(httpPort) : Number(httpsPort);
        if (isNaN(localPort)) {
            throw new Error(`Invalid local port configuration: ${localPort}`);
        }
        try {
            const mapping = await this.upnpService.createOrRenewUpnpLease({ localPort });
            this.configService.set('connect.config.wanport', mapping.publicPort);
            this.eventEmitter.emit(EVENTS.ENABLE_WAN_ACCESS);
            return this.urlResolverService.getRemoteAccessUrl();
        } catch (error) {
            this.logger.error(error, 'Failed to begin UPNP Remote Access');
            await this.stop();
        }
    }
}
