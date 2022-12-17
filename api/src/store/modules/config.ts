import { parseConfig } from '@app/core/utils/misc/parse-config';
import { type MyServersConfig, type MyServersConfigMemory } from '@app/types/my-servers-config';
import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { access } from 'fs/promises';
import merge from 'lodash/merge';
import { FileLoadStatus } from '@app/store/types';
import { randomBytes } from 'crypto';
import { F_OK } from 'constants';
import { clearAllServers } from '@app/store/modules/servers';
import { type RecursivePartial } from '@app/types';
import { MinigraphStatus } from '@app/graphql/generated/api/types';

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
		apikey: '',
		email: '',
		username: '',
		avatar: '',
		regWizTime: '',
		accesstoken: '',
		idtoken: '',
		refreshtoken: '',
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
	},
};

type LoadedConfig = Partial<MyServersConfig> & {
	api: {
		version: string;
	};
	upc: {
		apikey: string;
	};
	notifier: {
		apikey: string;
	};
};

export const logoutUser = createAsyncThunk<void>('config/logout-user', async () => {
	const { store } = await import ('@app/store');
	const { pubsub } = await import ('@app/core/pubsub');
	// Clear servers cache
	store.dispatch(clearAllServers());

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
 * Load the myservers.cfg into the store.
 *
 * Note: If the file doesn't exist this will fallback to default values.
 */
export const loadConfigFile = createAsyncThunk<LoadedConfig, string | undefined>('config/load-config-file', async filePath => {
	const store = await import('@app/store');
	const paths = store.getters.paths();
	const config = store.getters.config();
	const path = filePath ?? paths['myservers-config'];
	const fileExists = await access(path, F_OK).then(() => true).catch(() => false);
	const file = fileExists ? parseConfig<RecursivePartial<MyServersConfig>>({
		filePath: path,
		type: 'ini',
	}) : {};
	return merge(file, {
		api: {
			version: config.api.version,
		},
		upc: {
			apikey: file.upc?.apikey?.trim()?.length === 64 ? file.upc?.apikey : `unupc_${randomBytes(58).toString('hex')}`.substring(0, 64),
		},
		notifier: {
			apikey: file.notifier?.apikey?.trim().length === 64 ? file.notifier?.apikey : `unnotify_${randomBytes(58).toString('hex')}`.substring(0, 64),
		},
	}) as LoadedConfig;
});

export const config = createSlice({
	name: 'config',
	initialState,
	reducers: {
		updateUserConfig(state, action: PayloadAction<RecursivePartial<MyServersConfig>>) {
			return merge(state, action.payload);
		},
		setConnectionStatus(state, action: PayloadAction<Partial<SliceState['connectionStatus']>>) {
			state.connectionStatus = merge(state.connectionStatus, action.payload);
		},
		updateAccessTokens(state, action: PayloadAction<Partial<Pick<Pick<MyServersConfig, 'remote'>['remote'], 'accesstoken' | 'refreshtoken' | 'idtoken'>>>) {
			return merge(state, { remote: action.payload });
		},
		setUpnpState(state, action: PayloadAction<{ enabled: 'no' | 'yes'; error: string | null }>) {
			state.remote.upnpEnabled = action.payload.enabled;
			state.connectionStatus.upnpError = action.payload.error;
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
			merge(state, action.payload, { status: FileLoadStatus.LOADED });
		});

		builder.addCase(loadConfigFile.rejected, (state, action) => {
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
	},
});

export const { updateUserConfig, setConnectionStatus, updateAccessTokens, setUpnpState, setWanPortToValue } = config.actions;
