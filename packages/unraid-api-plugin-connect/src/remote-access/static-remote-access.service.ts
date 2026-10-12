import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { ConfigType, DynamicRemoteAccessType, MyServersConfig } from '../config/connect.config.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { AccessUrl, UrlResolverService } from '../network/url-resolver.service.js';

@Injectable()
export class StaticRemoteAccessService {
    private activeStart?: { ready: boolean };

    constructor(
        private readonly configService: ConfigService<ConfigType>,
        private readonly eventEmitter: EventEmitter2,
        private readonly urlResolverService: UrlResolverService
    ) {}

    private logger = new Logger(StaticRemoteAccessService.name);

    isReady(): boolean {
        return this.activeStart?.ready === true;
    }

    async stopRemoteAccess() {
        this.activeStart = undefined;
        await this.eventEmitter.emitAsync(EVENTS.DISABLE_WAN_ACCESS);
    }

    async beginRemoteAccess(): Promise<AccessUrl | null> {
        this.logger.log('Begin Static Remote Access');
        // enabling/disabling static remote access is a config-only change.
        // the actual forwarding must be configured on the router, outside of the API.
        const attempt = { ready: false };
        this.activeStart = attempt;
        const results: unknown[] = await this.eventEmitter.emitAsync(EVENTS.ENABLE_WAN_ACCESS);
        if (!results.length || results.some((result) => result !== true)) {
            throw new Error('Failed to reload nginx for Static Remote Access');
        }
        attempt.ready = true;
        return this.urlResolverService.getRemoteAccessUrl();
    }
}
