import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { NetworkService } from "../service/network.service.js";
import { ConfigService } from "@nestjs/config";
import { ConfigType } from "../model/connect-config.model.js";
import { UrlResolverService } from "../service/url-resolver.service.js";
import { EVENTS } from "../helper/nest-tokens.js";
import { OnEvent } from "@nestjs/event-emitter";

@Injectable()
export class WanAccessEventHandler implements OnModuleDestroy {
    constructor(
        private readonly configService: ConfigService<ConfigType>,
        private readonly networkService: NetworkService,
    ) {}

    async onModuleDestroy() {
        await this.disableWanAccess();
    }

    @OnEvent(EVENTS.ENABLE_WAN_ACCESS, { async: true })
    async enableWanAccess() {
        this.configService.set('connect.config.wanaccess', true);
        await this.networkService.reloadNetworkStack();
    }

    @OnEvent(EVENTS.DISABLE_WAN_ACCESS, { async: true })
    async disableWanAccess() {
        this.configService.set('connect.config.wanaccess', false);
        await this.networkService.reloadNetworkStack();
    }
}