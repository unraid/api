import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigType, DynamicRemoteAccessState, DynamicRemoteAccessType, MyServersConfig } from '../config.entity.js';
import { NetworkService } from '../system/network.service.js';

@Injectable()
export class StaticRemoteAccessService {
    constructor(
        private readonly configService: ConfigService<ConfigType>,
        private readonly networkService: NetworkService,
    ) {}

    private logger = new Logger(StaticRemoteAccessService.name);

    getRemoteAccessUrl() {
        // todo: implement getServerIps, return the first WAN IP
        return null;
    }

    async stopRemoteAccess() {
        this.configService.set('connect.config.wanaccess', false);
        await this.networkService.reloadNetworkStack();
    }

    async beginRemoteAccess() {
        const { dynamicRemoteAccessType } = this.configService.getOrThrow<MyServersConfig>('connect.config');
        if (dynamicRemoteAccessType !== DynamicRemoteAccessType.STATIC) {
            this.logger.error('Invalid Dynamic Remote Access Type: %s', dynamicRemoteAccessType);
            return null;
        }
        this.logger.log('Enabling Static Remote Access');
        this.configService.set('connect.config.wanaccess', true);
        await this.networkService.reloadNetworkStack();
        return this.getRemoteAccessUrl();
    }
}
