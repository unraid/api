import { F_OK } from 'constants';
import { writeFileSync } from 'fs';
import { access } from 'fs/promises';

import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice, isAnyOf } from '@reduxjs/toolkit';
import { isEqual, merge } from 'lodash-es';

import type { Owner } from '@app/graphql/generated/api/types.js';
import { logger } from '@app/core/log.js';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub.js';
import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer.js';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer.js';
import { parseConfig } from '@app/core/utils/misc/parse-config.js';
import { NODE_ENV } from '@app/environment.js';
import { DynamicRemoteAccessType, MinigraphStatus } from '@app/graphql/generated/api/types.js';
import { GraphQLClient } from '@app/mothership/graphql-client.js';
import { stopPingTimeoutJobs } from '@app/mothership/jobs/ping-timeout-jobs.js';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status.js';
import { setupRemoteAccessThunk } from '@app/store/actions/setup-remote-access.js';
import { type RootState } from '@app/store/index.js';
import { FileLoadStatus } from '@app/store/types.js';
import { RecursivePartial } from '@app/types/index.js';
import { type MyServersConfig, type MyServersConfigMemory } from '@app/types/my-servers-config.js';

export type SliceState = {
    status: FileLoadStatus;
    nodeEnv: string;
} & MyServersConfigMemory;

export const initialState: SliceState = {
    status: FileLoadStatus.UNLOADED,
    nodeEnv: NODE_ENV,
    remote: {
        wanaccess: '',
        wanport: '',
        upnpEnabled: '',
        apikey: '',
        localApiKey: '',
        email: '',
        username: '',
        avatar: '',
        regWizTime: '',
        accesstoken: '',
        idtoken: '',
        refreshtoken: '',
        allowedOrigins: '',
        dynamicRemoteAccessType: DynamicRemoteAccessType.DISABLED,
        ssoSubIds: '',
    },
    local: {
        sandbox: 'no',
    },
    api: {
        extraOrigins: '',
        version: '',
    },
    connectionStatus: {
        minigraph: MinigraphStatus.PRE_INIT,
        upnpStatus: '',
    },
} as const;

export const loginUser = createAsyncThunk<
    Pick<MyServersConfig['remote'], 'email' | 'avatar' | 'username' | 'apikey' | 'localApiKey'>,
    Pick<MyServersConfig['remote'], 'email' | 'avatar' | 'username' | 'apikey' | 'localApiKey'>,
    { state: RootState }
>('config/login-user', async (userInfo) => {
    logger.info('Logging in user: %s', userInfo.username);
    const owner: Owner = {
        username: userInfo.username,
        avatar: userInfo.avatar,
    };
    await pubsub.publish(PUBSUB_CHANNEL.OWNER, { owner });
    return userInfo;
});

export const logoutUser = createAsyncThunk<void, { reason?: string }, { state: RootState }>(
    'config/logout-user',
    async ({ reason }) => {
        logger.info('Logging out user: %s', reason ?? 'No reason provided');
        const { pubsub } = await import('@app/core/pubsub.js');

        // Publish to servers endpoint
        await pubsub.publish(PUBSUB_CHANNEL.SERVERS, {
            servers: [],
        });

        const owner: Owner = {
            username: 'root',
            url: '',
            avatar: '',
        };
        // Publish to owner endpoint
        await pubsub.publish(PUBSUB_CHANNEL.OWNER, { owner });
        stopPingTimeoutJobs();
        await GraphQLClient.clearInstance();
    }
);

/**
 * Load the myservers.cfg into the store. Returns null if the state after loading doesn't change
 *
 * Note: If the file doesn't exist this will fallback to default values.
 */
enum CONFIG_LOAD_ERROR {
    CONFIG_EQUAL = 'CONFIG_EQUAL',
    CONFIG_CORRUPTED = 'CONFIG_CORRUPTED',
}

type LoadFailureWithConfig = {
    type: CONFIG_LOAD_ERROR.CONFIG_CORRUPTED;
    error: Error | null;
    config: MyServersConfig;
};
type LoadFailureConfigEqual = {
    type: CONFIG_LOAD_ERROR.CONFIG_EQUAL;
};
type ConfigRejectedValues = LoadFailureConfigEqual | LoadFailureWithConfig;

export const loadConfigFile = createAsyncThunk<
    MyServersConfig,
    string | undefined,
    {
        state: RootState;
        rejectValue: ConfigRejectedValues;
    }
>('config/load-config-file', async (filePath, { getState, rejectWithValue }) => {
    try {
        const { paths, config } = getState();

        const path = filePath ?? paths['myservers-config'];

        const fileExists = await access(path, F_OK)
            .then(() => true)
            .catch(() => false);
        if (!fileExists) {
            throw new Error('Config File Missing');
        }

        const newConfigFile = getWriteableConfig(
            parseConfig<MyServersConfig>({ filePath: path, type: 'ini' }),
            'flash'
        );

        const isNewlyLoadedConfigEqual = isEqual(newConfigFile, getWriteableConfig(config, 'flash'));
        if (isNewlyLoadedConfigEqual) {
            logger.warn('Not loading config because it is the same as before');
            return rejectWithValue({
                type: CONFIG_LOAD_ERROR.CONFIG_EQUAL,
            });
        }
        return newConfigFile;
    } catch (error: unknown) {
        logger.warn('Config file is corrupted with error: %o - recreating config', error);
        const newConfig = getWriteableConfig(initialState, 'flash');
        newConfig.remote.wanaccess = 'no';
        const serializedConfig = safelySerializeObjectToIni(newConfig);
        writeFileSync(getState().paths['myservers-config'], serializedConfig);
        return rejectWithValue({
            type: CONFIG_LOAD_ERROR.CONFIG_CORRUPTED,
            error: error instanceof Error ? error : new Error('Unknown Error'),
            config: newConfig,
        });
    }
});

export const config = createSlice({
    name: 'config',
    initialState,
    reducers: {
        updateUserConfig(state, action: PayloadAction<RecursivePartial<MyServersConfig>>) {
            return merge(state, action.payload);
        },
        updateAccessTokens(
            state,
            action: PayloadAction<
                Partial<
                    Pick<
                        Pick<MyServersConfig, 'remote'>['remote'],
                        'accesstoken' | 'refreshtoken' | 'idtoken'
                    >
                >
            >
        ) {
            return merge(state, { remote: action.payload });
        },
        updateAllowedOrigins(state, action: PayloadAction<string[]>) {
            state.api.extraOrigins = action.payload.join(', ');
        },
        setUpnpState(
            state,
            action: PayloadAction<{
                enabled?: 'no' | 'yes' | 'auto';
                status?: string | null;
            }>
        ) {
            if (action.payload.enabled) {
                state.remote.upnpEnabled = action.payload.enabled;
            }

            if (action.payload.status) {
                state.connectionStatus.upnpStatus = action.payload.status;
            }
        },
        setWanPortToValue(state, action: PayloadAction<number>) {
            logger.debug('Wan port set to %s', action.payload);
            state.remote.wanport = String(action.payload);
        },
        setWanAccess(state, action: PayloadAction<'yes' | 'no'>) {
            state.remote.wanaccess = action.payload;
        },
        addSsoUser(state, action: PayloadAction<string>) {
            // First check if state already has ID, otherwise append it
            if (state.remote.ssoSubIds.includes(action.payload)) {
                return;
            }
            const stateAsArray = state.remote.ssoSubIds.split(',').filter((id) => id !== '');
            stateAsArray.push(action.payload);
            state.remote.ssoSubIds = stateAsArray.join(',');
        },
        setSsoUsers(state, action: PayloadAction<string[]>) {
            state.remote.ssoSubIds = action.payload.filter((id) => id).join(',');
        },
        removeSsoUser(state, action: PayloadAction<string | null>) {
            if (action.payload === null) {
                state.remote.ssoSubIds = '';
                return;
            }
            if (!state.remote.ssoSubIds.includes(action.payload)) {
                return;
            }
            const stateAsArray = state.remote.ssoSubIds.split(',').filter((id) => id !== action.payload);
            state.remote.ssoSubIds = stateAsArray.join(',');
        },
        setLocalApiKey(state, action: PayloadAction<string | null>) {
            if (action.payload) {
                state.remote.localApiKey = action.payload;
            }
        },
    },
    extraReducers(builder) {
        builder.addCase(loadConfigFile.pending, (state) => {
            state.status = FileLoadStatus.LOADING;
        });

        builder.addCase(loadConfigFile.fulfilled, (state, action) => {
            if (action.payload) {
                merge(state, action.payload, { status: FileLoadStatus.LOADED });
            } else {
                state.status = FileLoadStatus.LOADED;
            }
        });

        builder.addCase(loadConfigFile.rejected, (state, action) => {
            switch (action.payload?.type) {
                case CONFIG_LOAD_ERROR.CONFIG_EQUAL:
                    logger.debug('Configs equivalent');
                    state.status = FileLoadStatus.LOADED;
                    break;
                case CONFIG_LOAD_ERROR.CONFIG_CORRUPTED:
                    logger.debug('Config File Load Failed - %o', action.payload.error);
                    merge(state, action.payload.config);
                    state.status = FileLoadStatus.LOADED;
                    break;
                default:
                    logger.error('Config File Load Failed', action.error);
            }
        });

        builder.addCase(loginUser.fulfilled, (state, action) => {
            merge(state, {
                remote: {
                    apikey: action.payload.apikey,
                    localApiKey: action.payload.localApiKey,
                    email: action.payload.email,
                    username: action.payload.username,
                    avatar: action.payload.avatar,
                },
            });
        });

        builder.addCase(logoutUser.fulfilled, (state) => {
            merge(state, {
                remote: {
                    apikey: '',
                    localApiKey: '',
                    avatar: '',
                    email: '',
                    username: '',
                    idtoken: '',
                    accessToken: '',
                    refreshToken: '',
                    dynamicRemoteAccessType: DynamicRemoteAccessType.DISABLED,
                },
            });
        });

        builder.addCase(setGraphqlConnectionStatus, (state, action) => {
            state.connectionStatus.minigraph = action.payload.status;
        });

        builder.addCase(setupRemoteAccessThunk.fulfilled, (state, action) => {
            state.remote.wanaccess = action.payload.wanaccess;
            state.remote.dynamicRemoteAccessType = action.payload.dynamicRemoteAccessType;
            state.remote.wanport = action.payload.wanport;
            state.remote.upnpEnabled = action.payload.upnpEnabled;
        });
    },
});
const { actions, reducer } = config;

export const {
    addSsoUser,
    setSsoUsers,
    updateUserConfig,
    updateAccessTokens,
    updateAllowedOrigins,
    setUpnpState,
    setWanPortToValue,
    setWanAccess,
    removeSsoUser,
    setLocalApiKey,
} = actions;

/**
 * Actions that should trigger a flash write
 */
export const configUpdateActionsFlash = isAnyOf(
    addSsoUser,
    updateUserConfig,
    updateAccessTokens,
    updateAllowedOrigins,
    setUpnpState,
    setWanPortToValue,
    setWanAccess,
    setupRemoteAccessThunk.fulfilled,
    logoutUser.fulfilled,
    loginUser.fulfilled,
    removeSsoUser,
    setLocalApiKey
);

/**
 * Actions that should trigger a memory write
 */
export const configUpdateActionsMemory = isAnyOf(configUpdateActionsFlash, setGraphqlConnectionStatus);

export const configReducer = reducer;
