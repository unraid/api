import { parseConfig } from '@app/core/utils/misc/parse-config';
import { MyServersConfig } from '@app/types/my-servers-config';
import { safelySerializeObjectToIni } from '@app/core/utils/files/safe-ini-serializer';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { access, writeFile } from 'fs/promises';
import merge from 'lodash/merge';
import { logger } from '@app/core/log';
import { FileLoadStatus } from '@app/store/types';
import { randomBytes } from 'crypto';
import { F_OK } from 'constants';
import { clearAllServers } from '@app/store/modules/servers';

export type SliceState = {
	status: FileLoadStatus;
	nodeEnv: string;
	remote: {
		'2Fa': string;
		wanaccess: string;
		wanport: string;
		apikey: string;
		email: string;
		username: string;
		avatar: string;
	};
	local: {
		'2Fa': string;
	};
	api: {
		extraOrigins: string;
		version: string;
	};
	upc: {
		apikey: string;
	};
	notifier: {
		apikey: string;
	};
};

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
	},
	local: {
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

export const writeConfigToDisk = createAsyncThunk<void, string | undefined, { state: { config: SliceState } }>('config/write-config-to-disk', async (filePath, thunkAPI) => {
	try {
		const paths = await import('@app/store').then(_ => _.getters.paths());
		logger.debug('Dumping MyServers config back to file');

		// Get current state
		const { config: { api, local, notifier, remote, upc } } = thunkAPI.getState();

		// Stringify state
		const stringifiedData = safelySerializeObjectToIni({ api, local, notifier, remote, upc });

		// Update config file
		await writeFile(filePath ?? paths['myservers-config'], stringifiedData);
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(error as string);
		logger.error('Failed writing config to disk with "%s"', error.message);
	}
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
	const file = fileExists ? parseConfig<Partial<MyServersConfig>>({
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
		updateUserConfig(state, action: PayloadAction<Partial<MyServersConfig>>) {
			return merge(state, action.payload);
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

export const { updateUserConfig } = config.actions;
