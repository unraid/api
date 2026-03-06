import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Args, Mutation, Query, Resolver, Subscription } from '@nestjs/graphql';

import { AuthAction, Resource } from '@unraid/shared/graphql.model.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';

import { createSubscription, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { getters } from '@app/store/index.js';
import { MinigraphStatus } from '@app/unraid-api/graph/resolvers/cloud/cloud.model.js';
import {
    ProfileModel,
    Server as ServerModel,
    ServerStatus,
} from '@app/unraid-api/graph/resolvers/servers/server.model.js';
import { ServerService } from '@app/unraid-api/graph/resolvers/servers/server.service.js';

@Injectable()
@Resolver(() => ServerModel)
export class ServerResolver {
    constructor(
        private readonly configService: ConfigService,
        private readonly serverService: ServerService
    ) {}
    @Query(() => ServerModel, { nullable: true })
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.SERVERS,
    })
    public async server(): Promise<ServerModel | null> {
        return this.getLocalServer() || null;
    }

    @Query(() => [ServerModel])
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.SERVERS,
    })
    public async servers(): Promise<ServerModel[]> {
        return [this.getLocalServer()];
    }

    @Subscription(() => ServerModel)
    @UsePermissions({
        action: AuthAction.READ_ANY,
        resource: Resource.SERVERS,
    })
    public async serversSubscription() {
        return createSubscription(PUBSUB_CHANNEL.SERVERS);
    }

    @Mutation(() => ServerModel, { description: 'Update server name, comment, and model' })
    @UsePermissions({
        action: AuthAction.UPDATE_ANY,
        resource: Resource.SERVERS,
    })
    public async updateServerIdentity(
        @Args('name') name: string,
        @Args('comment', { nullable: true }) comment?: string,
        @Args('sysModel', { nullable: true }) sysModel?: string
    ): Promise<ServerModel> {
        return this.serverService.updateServerIdentity(name, comment, sysModel);
    }

    private getLocalServer(): ServerModel {
        const emhttp = getters.emhttp();
        const connectConfig = this.configService.get('connect');

        const guid = emhttp.var.regGuid;
        const name = emhttp.var.name;
        const comment = emhttp.var.comment;
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

        return {
            id: 'local',
            owner,
            guid: guid || '',
            apikey: connectConfig?.config?.apikey ?? '',
            name: name ?? 'Local Server',
            comment,
            status: ServerStatus.ONLINE,
            wanip,
            lanip,
            localurl,
            remoteurl,
        };
    }
}
