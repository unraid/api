import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ConfigType, DynamicRemoteAccessType, MyServersConfig } from '../config/connect.config.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { AccessUrl, UrlResolverService } from '../service/url-resolver.service.js';

@Injectable()
export class StaticRemoteAccessService {
    constructor(
        private readonly configService: ConfigService<ConfigType>,
        private readonly eventEmitter: EventEmitter2,
        private readonly urlResolverService: UrlResolverService
    ) {}

    private logger = new Logger(StaticRemoteAccessService.name);

    async stopRemoteAccess() {
        this.eventEmitter.emit(EVENTS.DISABLE_WAN_ACCESS);
    }

    async beginRemoteAccess(): Promise<AccessUrl | null> {
        this.logger.log('Begin Static Remote Access');
        // enabling/disabling static remote access is a config-only change.
        // the actual forwarding must be configured on the router, outside of the API.
        this.eventEmitter.emit(EVENTS.ENABLE_WAN_ACCESS);
        return this.urlResolverService.getRemoteAccessUrl();
    }
}
