import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Query, ResolveField, Resolver } from '@nestjs/graphql';

import { Resource } from '@unraid/shared/graphql.model.js';
import {
    AuthActionVerb,
    AuthPossession,
    UsePermissions,
} from '@unraid/shared/use-permissions.directive.js';

import { ConfigType, ConnectConfig, DynamicRemoteAccessType } from '../config/connect.config.js';
import { Connect, ConnectSettings, DynamicRemoteAccessStatus } from '../model/connect.model.js';

@Resolver(() => Connect)
export class ConnectResolver {
    protected logger = new Logger(ConnectResolver.name);
    constructor(private readonly configService: ConfigService<ConfigType>) {}

    @Query(() => Connect)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public connect(): Connect {
        return {
            id: 'connect',
        };
    }

    @ResolveField(() => DynamicRemoteAccessStatus)
    public dynamicRemoteAccess(): DynamicRemoteAccessStatus {
        const state = this.configService.getOrThrow<ConnectConfig>('connect');
        return {
            runningType: state.dynamicRemoteAccess.runningType,
            enabledType: state.config.dynamicRemoteAccessType ?? DynamicRemoteAccessType.DISABLED,
            error: state.dynamicRemoteAccess.error ?? undefined,
        };
    }

    @ResolveField(() => ConnectSettings)
    public async settings(): Promise<ConnectSettings> {
        return {} as ConnectSettings;
    }
}
