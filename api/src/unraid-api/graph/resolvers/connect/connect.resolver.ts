import { Logger } from '@nestjs/common';
import { Args, Mutation, Query, ResolveField, Resolver } from '@nestjs/graphql';

import { GraphQLError } from 'graphql';
import { AuthActionVerb, AuthPossession, UsePermissions } from 'nest-authz';

import { getAllowedOrigins, getExtraOrigins } from '@app/common/allowed-origins.js';
import { RemoteAccessController } from '@app/remoteAccess/remote-access-controller.js';
import { setupRemoteAccessThunk } from '@app/store/actions/setup-remote-access.js';
import { getters, store } from '@app/store/index.js';
import { loginUser, logoutUser, updateAllowedOrigins } from '@app/store/modules/config.js';
import { setAllowedRemoteAccessUrl } from '@app/store/modules/dynamic-remote-access.js';
import { Resource } from '@app/unraid-api/graph/resolvers/base.model.js';
import { ConnectSettingsService } from '@app/unraid-api/graph/resolvers/connect/connect-settings.service.js';
import {
    ApiSettingsInput,
    Connect,
    ConnectSettings,
    ConnectSignInInput,
    DynamicRemoteAccessStatus,
    DynamicRemoteAccessType,
    RemoteAccess,
    SetupRemoteAccessInput,
    WAN_ACCESS_TYPE,
    WAN_FORWARD_TYPE,
} from '@app/unraid-api/graph/resolvers/connect/connect.model.js';
import { ConnectService } from '@app/unraid-api/graph/resolvers/connect/connect.service.js';

@Resolver(() => Connect)
export class ConnectResolver {
    protected logger = new Logger(ConnectResolver.name);
    constructor(
        private readonly connectSettingsService: ConnectSettingsService,
        private readonly connectService: ConnectService
    ) {}

    @Query(() => Connect)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public connect(): Connect {
        return {
            id: 'connect',
            dynamicRemoteAccess: {
                runningType: DynamicRemoteAccessType.DISABLED,
                enabledType: DynamicRemoteAccessType.DISABLED,
                error: undefined,
            },
            settings: {
                id: 'connectSettingsForm',
                dataSchema: {},
                uiSchema: {},
                values: {
                    sandbox: false,
                    extraOrigins: [],
                    accessType: WAN_ACCESS_TYPE.DISABLED,
                    ssoUserIds: [],
                },
            },
        };
    }

    @ResolveField(() => String)
    public id() {
        return 'connect';
    }

    @ResolveField(() => ConnectSettings)
    public async settings(): Promise<ConnectSettings> {
        const { properties, elements } = await this.connectSettingsService.buildSettingsSchema();
        return {
            id: 'connectSettingsForm',
            dataSchema: {
                type: 'object',
                properties,
            },
            uiSchema: {
                type: 'VerticalLayout',
                elements,
            },
            values: await this.connectSettingsService.getCurrentSettings(),
        };
    }

    @Mutation(() => ConnectSettings)
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONFIG,
        possession: AuthPossession.ANY,
    })
    public async updateApiSettings(@Args('input') settings: ApiSettingsInput) {
        this.logger.verbose(`Attempting to update API settings: ${JSON.stringify(settings, null, 2)}`);
        const restartRequired = await this.connectSettingsService.syncSettings(settings);
        const currentSettings = await this.connectSettingsService.getCurrentSettings();
        if (restartRequired) {
            setTimeout(async () => {
                // Send restart out of band to avoid blocking the return of this resolver
                this.logger.log('Restarting API');
                await this.connectService.restartApi();
            }, 300);
        }
        return currentSettings;
    }

    @ResolveField(() => DynamicRemoteAccessStatus)
    public dynamicRemoteAccess(): DynamicRemoteAccessStatus {
        const state = store.getState();
        return {
            runningType: state.dynamicRemoteAccess.runningType,
            enabledType: state.config.remote.dynamicRemoteAccessType ?? DynamicRemoteAccessType.DISABLED,
            error: state.dynamicRemoteAccess.error ?? undefined,
        };
    }

    @Mutation(() => Boolean)
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONNECT__REMOTE_ACCESS,
        possession: AuthPossession.ANY,
    })
    public async enableDynamicRemoteAccess(
        @Args('input') dynamicRemoteAccessInput: EnableDynamicRemoteAccessInput
    ): Promise<boolean> {
        // Start or extend dynamic remote access
        const state = store.getState();

        const { dynamicRemoteAccessType } = state.config.remote;
        if (!dynamicRemoteAccessType || dynamicRemoteAccessType === DynamicRemoteAccessType.DISABLED) {
            throw new GraphQLError('Dynamic Remote Access is not enabled.', {
                extensions: { code: 'FORBIDDEN' },
            });
        }

        const controller = RemoteAccessController.instance;

        if (dynamicRemoteAccessInput.enabled === false) {
            controller.stopRemoteAccess({
                getState: store.getState,
                dispatch: store.dispatch,
            });
            return true;
        } else if (controller.getRunningRemoteAccessType() === DynamicRemoteAccessType.DISABLED) {
            if (dynamicRemoteAccessInput.url) {
                store.dispatch(setAllowedRemoteAccessUrl(dynamicRemoteAccessInput.url));
            }
            controller.beginRemoteAccess({
                getState: store.getState,
                dispatch: store.dispatch,
            });
        } else {
            controller.extendRemoteAccess({
                getState: store.getState,
                dispatch: store.dispatch,
            });
        }

        return true;
    }

    @Mutation(() => Boolean)
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async connectSignIn(@Args('input') input: ConnectSignInInput): Promise<boolean> {
        return this.connectService.signIn(input);
    }

    @Mutation(() => Boolean)
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async connectSignOut() {
        await store.dispatch(logoutUser({ reason: 'Manual Sign Out Using API' }));
        return true;
    }

    @Mutation(() => Boolean)
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async setupRemoteAccess(@Args('input') input: SetupRemoteAccessInput): Promise<boolean> {
        await store.dispatch(setupRemoteAccessThunk(input)).unwrap();
        return true;
    }

    @Query(() => RemoteAccess)
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async remoteAccess(): Promise<RemoteAccess> {
        const hasWanAccess = getters.config().remote.wanaccess === 'yes';
        const dynamicRemoteAccessSettings: RemoteAccess = {
            accessType: hasWanAccess
                ? getters.config().remote.dynamicRemoteAccessType !== DynamicRemoteAccessType.DISABLED
                    ? WAN_ACCESS_TYPE.DYNAMIC
                    : WAN_ACCESS_TYPE.ALWAYS
                : WAN_ACCESS_TYPE.DISABLED,
            forwardType: getters.config().remote.upnpEnabled
                ? WAN_FORWARD_TYPE.UPNP
                : WAN_FORWARD_TYPE.STATIC,
            port: getters.config().remote.wanport ? Number(getters.config().remote.wanport) : undefined,
        };

        return dynamicRemoteAccessSettings;
    }

    @Query(() => [String])
    @UsePermissions({
        action: AuthActionVerb.READ,
        resource: Resource.CONNECT,
        possession: AuthPossession.ANY,
    })
    public async extraAllowedOrigins(): Promise<Array<string>> {
        const extraOrigins = getExtraOrigins();
        return extraOrigins;
    }

    @Mutation(() => [String])
    @UsePermissions({
        action: AuthActionVerb.UPDATE,
        resource: Resource.CONFIG,
        possession: AuthPossession.ANY,
    })
    public async setAdditionalAllowedOrigins(@Args('input') input: AllowedOriginInput) {
        await store.dispatch(updateAllowedOrigins(input.origins));
        return getAllowedOrigins();
    }
}
