import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { DynamicRemoteAccessState, makeDisabledDynamicRemoteAccessState } from '../config.entity.js';
import { ONE_MINUTE_MS } from '../helpers/consts.js';

@Injectable()
export class DynamicRemoteAccessStateService {
    private readonly logger = new Logger(DynamicRemoteAccessStateService.name);

    constructor(private readonly configService: ConfigService) {}

    get state() {
        return this.configService.getOrThrow<DynamicRemoteAccessState>('connect.dynamicRemoteAccess');
    }

    checkForTimeout() {
        const state = this.state;
        if (state.lastPing && Date.now() - state.lastPing > ONE_MINUTE_MS) {
            this.logger.warn('No pings received in 1 minute, disabling dynamic remote access');
            this.configService.set(
                'connect.dynamicRemoteAccess',
                makeDisabledDynamicRemoteAccessState()
            );
        }
    }
}
