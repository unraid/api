import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { EVENTS } from '../helper/nest-tokens.js';
import { ConfigType, DynamicRemoteAccessType, MyServersConfig } from '../model/connect-config.model.js';
import { AccessUrl, UrlResolverService } from './url-resolver.service.js';

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
        const { dynamicRemoteAccessType } =
            this.configService.getOrThrow<MyServersConfig>('connect.config');
        if (dynamicRemoteAccessType !== DynamicRemoteAccessType.STATIC) {
            this.logger.error('Invalid Dynamic Remote Access Type: %s', dynamicRemoteAccessType);
            return null;
        }
        this.logger.log('Enabling Static Remote Access');
        this.eventEmitter.emit(EVENTS.ENABLE_WAN_ACCESS);
        return this.urlResolverService.getRemoteAccessUrl();
    }
}
