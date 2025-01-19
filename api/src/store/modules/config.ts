import { F_OK } from 'constants';
import { randomBytes } from 'crypto';
import { writeFileSync } from 'fs';
import { access } from 'fs/promises';

import type { PayloadAction } from '@reduxjs/toolkit';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { isEqual } from 'lodash-es';
import merge from 'lodash/merge';

import type { Owner } from '@app/graphql/generated/api/types';
import { logger } from '@app/core/log';
import { pubsub, PUBSUB_CHANNEL } from '@app/core/pubsub';
import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { NODE_ENV } from '@app/environment';
import { DynamicRemoteAccessType, MinigraphStatus } from '@app/graphql/generated/api/types';
import { GraphQLClient } from '@app/mothership/graphql-client';
import { stopPingTimeoutJobs } from '@app/mothership/jobs/ping-timeout-jobs';
import { type RootState } from '@app/store';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { setupRemoteAccessThunk } from '@app/store/actions/setup-remote-access';
import { FileLoadStatus } from '@app/store/types';
import { type RecursivePartial } from '@app/types';
import { type MyServersConfig, type MyServersConfigMemory } from '@app/types/my-servers-config';

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
    local: {},
    api: {
        extraOrigins: '',
        version: '',
    },
    upc: {
        apikey: '',
    },
    notifier: {
        apikey: '',
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
        const { pubsub } = await import('@app/core/pubsub');

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
    updateUserConfig,
    updateAccessTokens,
    updateAllowedOrigins,
    setUpnpState,
    setWanPortToValue,
    setWanAccess,
} = actions;

export const configReducer = reducer;
