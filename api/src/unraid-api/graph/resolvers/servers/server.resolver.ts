import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Query, Resolver, Subscription } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { getters } from '@app/store/index.js';
import { MinigraphStatus } from '@app/unraid-api/graph/resolvers/cloud/cloud.model.js';
import {
    ProfileModel,
    Server as ServerModel,
    ServerStatus,
} from '@app/unraid-api/graph/resolvers/servers/server.model.js';

@Injectable()
@Resolver(() => ServerModel)
export class ServerResolver {
    constructor(private readonly configService: ConfigService) {}
    @Query(() => ServerModel, { nullable: true })
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.SERVERS,
        possession: AuthPossession.ANY,
    })
    public async server(): Promise<ServerModel | null> {
        return this.getLocalServer()[0] || null;
    }

    @Query(() => [ServerModel])
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.SERVERS,
        possession: AuthPossession.ANY,
    })
    public async servers(): Promise<ServerModel[]> {
        return this.getLocalServer();
    }

    @Subscription(() => ServerModel)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.SERVERS,
        possession: AuthPossession.ANY,
    })
    public async serversSubscription() {
        return createSubscription(PUBSUB_CHANNEL.SERVERS);
    }

    private getLocalServer(): ServerModel[] {
        const emhttp = getters.emhttp();
        const connectConfig = this.configService.get('connect');

        const guid = emhttp.var.regGuid;
        const name = emhttp.var.name;
        const wanip = '';
        const lanip: string = emhttp.networks[0]?.ipaddr[0] || '';
        const port = emhttp.var?.port;
        const localurl = `http://${lanip}:${port}`;
        const remoteurl = '';

        const owner: ProfileModel = {
            id: 'local',
            username: connectConfig?.config?.username ?? 'root',
            url: '',
            avatar: '',
        };

        return [
            {
                id: 'local',
                owner,
                guid: guid || '',
                apikey: connectConfig?.config?.apikey ?? '',
                name: name ?? 'Local Server',
                status:
                    connectConfig?.mothership?.status === MinigraphStatus.CONNECTED
                        ? ServerStatus.ONLINE
                        : ServerStatus.OFFLINE,
                wanip,
                lanip,
                localurl,
                remoteurl,
            },
        ];
    }
}
