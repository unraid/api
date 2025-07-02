import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

import { ConfigType } from '../config/connect.config.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { NetworkService } from '../network/network.service.js';

@Injectable()
export class WanAccessEventHandler {
    private readonly logger = new Logger(WanAccessEventHandler.name);

    constructor(
        private readonly configService: ConfigService<ConfigType>,
        private readonly networkService: NetworkService
    ) {}

    @OnEvent(EVENTS.ENABLE_WAN_ACCESS, { async: true })
    async enableWanAccess() {
        this.logger.log('Enabling WAN Access');
        this.configService.set('connect.config.wanaccess', true);
        await this.networkService.reloadNetworkStack();
    }

    @OnEvent(EVENTS.DISABLE_WAN_ACCESS, { async: true })
    async disableWanAccess() {
        this.logger.log('Disabling WAN Access');
        this.configService.set('connect.config.wanaccess', false);
        await this.networkService.reloadNetworkStack();
    }
}
