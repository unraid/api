import { parseConfig } from '@app/core/utils/misc/parse-config';
import { type MyServersConfig, type MyServersConfigMemory } from '@app/types/my-servers-config';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { access } from 'fs/promises';
import merge from 'lodash/merge';
import { FileLoadStatus } from '@app/store/types';
import { F_OK } from 'constants';
import { clearAllServers } from '@app/store/modules/servers';
import { type RecursivePartial } from '@app/types';
import { MinigraphStatus } from '@app/graphql/generated/api/types';
import { type RootState } from '@app/store';
import { randomBytes } from 'crypto';
import { logger } from '@app/core/log';
import { setGraphqlConnectionStatus } from '@app/store/actions/set-minigraph-status';

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
	},
	local: {
		showT2Fa: '',
		'2Fa': '',
	},
	api: {
		extraOrigins: '',
		version: process.env.VERSION ?? 'THIS_WILL_BE_REPLACED_WHEN_BUILT', // This will be baked in at build time
	},
	upc: {
		apikey: '',
	},
	notifier: {
		apikey: '',
	},
	connectionStatus: {
		minigraph: MinigraphStatus.DISCONNECTED,
		upnpStatus: '',
	},
};

export const logoutUser = createAsyncThunk<void, void, { state: RootState }>('config/logout-user', async (_, { dispatch }) => {
	const { pubsub } = await import ('@app/core/pubsub');
	// Clear servers cache
	dispatch(clearAllServers());

	// Publish to servers endpoint
	await pubsub.publish('servers', {
		servers: [],
	});

	// Publish to owner endpoint
	await pubsub.publish('owner', {
		owner: {
			username: 'root',
			url: '',
			avatar: '',
		},
	});
});

/**
 * Load the myservers.cfg into the store. Returns null if the state after loading doesn't change
 *
 * Note: If the file doesn't exist this will fallback to default values.
 */
export const loadConfigFile = createAsyncThunk<MyServersConfig, string | undefined, { state: RootState }>('config/load-config-file',
	async (filePath, { getState }) => {
		const { paths, config } = getState();

		const path = filePath ?? paths['myservers-config'];

		const fileExists = await access(path, F_OK).then(() => true).catch(() => false);
		const file = fileExists ? parseConfig<RecursivePartial<MyServersConfig>>({
			filePath: path,
			type: 'ini',
		}) : {};

		const newConfigFile = merge(file,
			{
				api: {
					version: config.api.version,
				},
				upc: {
					apikey: file.upc?.apikey?.trim()?.length === 64 ? file.upc?.apikey : `unupc_${randomBytes(58).toString('hex')}`.substring(0, 64),
				},
				notifier: {
					apikey: file.notifier?.apikey?.trim().length === 64 ? file.notifier?.apikey : `unnotify_${randomBytes(58).toString('hex')}`.substring(0, 64),
				},
			},
		) as MyServersConfig;

		return newConfigFile;
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
			const newAllowedOrigins = action.payload.join(', ');
			if (newAllowedOrigins === state.remote.allowedOrigins) {
				return;
			}
			state.remote.allowedOrigins = newAllowedOrigins;
		},
		setUpnpState(state, action: PayloadAction<{ enabled?: 'no' | 'yes'; status?: string | null }>) {
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
	},
	extraReducers(builder) {
		builder.addCase(loadConfigFile.pending, (state, _action) => {
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
					'2Fa': '',
					apikey: '',
					avatar: '',
					email: '',
					username: '',
					wanaccess: '',
					wanport: '',
				},
			});
		});
		builder.addCase(setGraphqlConnectionStatus, (state, action) => {
			logger.debug('Setting graphql connection status', action.payload);
			state.connectionStatus.minigraph = action.payload.status;
		});
	},
});
const { actions, reducer } = config;

export const { updateUserConfig, updateAccessTokens, updateAllowedOrigins, setUpnpState, setWanPortToValue } = actions;

export const configReducer = reducer;
