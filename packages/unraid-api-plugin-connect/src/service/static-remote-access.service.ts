import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigType, DynamicRemoteAccessType, MyServersConfig } from '../model/config.entity.js';
import { NetworkService } from './network.service.js';
import { AccessUrl, UrlResolverService } from './url-resolver.service.js';

@Injectable()
export class StaticRemoteAccessService {
    constructor(
        private readonly configService: ConfigService<ConfigType>,
        private readonly networkService: NetworkService,
        private readonly urlResolverService: UrlResolverService
    ) {}

    private logger = new Logger(StaticRemoteAccessService.name);

    async stopRemoteAccess() {
        this.configService.set('connect.config.wanaccess', false);
        await this.networkService.reloadNetworkStack();
    }

    async beginRemoteAccess(): Promise<AccessUrl | null> {
        const { dynamicRemoteAccessType } =
            this.configService.getOrThrow<MyServersConfig>('connect.config');
        if (dynamicRemoteAccessType !== DynamicRemoteAccessType.STATIC) {
            this.logger.error('Invalid Dynamic Remote Access Type: %s', dynamicRemoteAccessType);
            return null;
        }
        this.logger.log('Enabling Static Remote Access');
        this.configService.set('connect.config.wanaccess', true);
        await this.networkService.reloadNetworkStack();
        return this.urlResolverService.getRemoteAccessUrl();
    }
}
