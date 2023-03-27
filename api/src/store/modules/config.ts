import { parseConfig } from '@app/core/utils/misc/parse-config';
import { type MyServersConfig, type MyServersConfigMemory } from '@app/types/my-servers-config';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { access } from 'fs/promises';
import merge from 'lodash/merge';
import { FileLoadStatus } from '@app/store/types';
import { F_OK } from 'constants';
import { type RecursivePartial } from '@app/types';
import { MinigraphStatus, type Owner } from '@app/graphql/generated/api/types';
import { type RootState } from '@app/store';
import { randomBytes } from 'crypto';
import { logger } from '@app/core/log';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';
import { getWriteableConfig } from '@app/core/utils/files/config-file-normalizer';
import { writeFileSync } from 'fs';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { pubsub } from '@app/core/pubsub';
import { DynamicRemoteAccessType } from '@app/remoteAccess/types';

export type SliceState = {
	status: FileLoadStatus;
	nodeEnv: string;
} & MyServersConfigMemory;

export const initialState: SliceState = {
	status: FileLoadStatus.UNLOADED,
	nodeEnv: process.env.NODE_ENV ?? 'production',
	remote: {
		'2Fa': '',
		wanaccess: '',
		wanport: '',
		upnpEnabled: '',
		apikey: '',
		email: '',
		username: '',
		avatar: '',
		regWizTime: '',
		accesstoken: '',
		idtoken: '',
		refreshtoken: '',
		allowedOrigins: '',
		dynamicRemoteAccessType: DynamicRemoteAccessType.DISABLED,
	},
	local: {
		showT2Fa: '',
		'2Fa': '',
	},
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

export const loginUser = createAsyncThunk<Pick<MyServersConfig['remote'], 'email' | 'avatar' | 'username'>, Pick<MyServersConfig['remote'], 'email' | 'avatar' | 'username'>, { state: RootState }>('config/login-user', async userInfo => {
	logger.info('Logging in user: %s', userInfo.username);
	const owner: Owner = {
		username: userInfo.username,
		avatar: userInfo.avatar,
	};
	await pubsub.publish('owner', { owner });
	return userInfo;
});

export const logoutUser = createAsyncThunk<void, { reason?: string }, { state: RootState }>('config/logout-user', async ({ reason }) => {
	logger.info('Logging out user: %s', reason ?? 'No reason provided');
	const { pubsub } = await import ('@app/core/pubsub');

	// Publish to servers endpoint
	await pubsub.publish('servers', {
		servers: [],
	});

	const owner: Owner = {
		username: 'root',
		url: '',
		avatar: '',
	};
	// Publish to owner endpoint
	await pubsub.publish('owner', { owner });
});

/**
 * Load the myservers.cfg into the store. Returns null if the state after loading doesn't change
 *
 * Note: If the file doesn't exist this will fallback to default values.
 */
export const loadConfigFile = createAsyncThunk<MyServersConfig, string | undefined, { state: RootState }>('config/load-config-file',
	async (filePath, { getState }) => {
		try {
			const { paths } = getState();

			const path = filePath ?? paths['myservers-config'];

			const fileExists = await access(path, F_OK).then(() => true).catch(() => false);
			if (!fileExists) {
				throw new Error('Config File Missing');
			}

			const file = fileExists ? parseConfig<RecursivePartial<MyServersConfig>>({
				filePath: path,
				type: 'ini',
			}) : {};

			const newConfigFile = merge(file,
				{
					upc: {
						apikey: file.upc?.apikey?.trim()?.length === 64 ? file.upc?.apikey : `unupc_${randomBytes(58).toString('hex')}`.substring(0, 64),
					},
					notifier: {
						apikey: file.notifier?.apikey?.trim().length === 64 ? file.notifier?.apikey : `unnotify_${randomBytes(58).toString('hex')}`.substring(0, 64),
					},
				},
			) as MyServersConfig;

			return newConfigFile;
		} catch (error: unknown) {
			logger.warn('Config file is corrupted, recreating config', error);
			const config = getWriteableConfig(initialState, 'flash');
			const serializedConfig = safelySerializeObjectToIni(config);
			writeFileSync(getState().paths['myservers-config'], serializedConfig);
			throw error;
		}
	});

export const config = createSlice({
	name: 'config',
	initialState,
	reducers: {
		updateUserConfig(state, action: PayloadAction<RecursivePartial<MyServersConfig>>) {
			return merge(state, action.payload);
		},
		updateAccessTokens(state, action: PayloadAction<Partial<Pick<Pick<MyServersConfig, 'remote'>['remote'], 'accesstoken' | 'refreshtoken' | 'idtoken'>>>) {
			return merge(state, { remote: action.payload });
		},
		updateAllowedOrigins(state, action: PayloadAction<string[]>) {
			state.remote.allowedOrigins = action.payload.join(', ');
		},
		setUpnpState(state, action: PayloadAction<{ enabled?: 'no' | 'yes' | 'auto'; status?: string | null }>) {
			if (action.payload.enabled) {
				state.remote.upnpEnabled = action.payload.enabled;
			}

			if (action.payload.status) {
				state.connectionStatus.upnpStatus = action.payload.status;
			}
		},
		setWanPortToValue(state, action: PayloadAction<number>) {
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
			logger.error('Config File Load Failed', action.error);
			merge(state, action.payload, { status: FileLoadStatus.FAILED_LOADING });
		});

		builder.addCase(logoutUser.pending, state => {
			merge(state, { remote:
				{
					apikey: '',
					avatar: '',
					email: '',
					username: '',
				},
			});
		});

		builder.addCase(setGraphqlConnectionStatus, (state, action) => {
			state.connectionStatus.minigraph = action.payload.status;
		});
	},
});
const { actions, reducer } = config;

export const { updateUserConfig, updateAccessTokens, updateAllowedOrigins, setUpnpState, setWanPortToValue, setWanAccess } = actions;

export const configReducer = reducer;
