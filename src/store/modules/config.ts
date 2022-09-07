import { Serializer as IniSerializer } from 'multi-ini';
import { parseConfig } from '@app/core/utils/misc/parse-config';
import { MyServersConfig } from '@app/types/my-servers-config';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { writeFile } from 'fs/promises';
import merge from 'lodash.merge';

type SliceState = {
	status: 'unloaded' | 'loading' | 'loaded';
	version: string;
	fullVersion: string;
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
	};
	upc: {
		apikey: string;
	};
	notifier: {
		apikey: string;
	};
};

const initialState: SliceState = {
	status: 'unloaded',
	version: process.env.VERSION!, // This will be baked in at build time
	fullVersion: process.env.FULL_VERSION!, // This will be baked in at build time
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
	},
	upc: {
		apikey: '',
	},
	notifier: {
		apikey: '',
	},
};

// Ini serializer
const serializer = new IniSerializer({
	// This ensures it ADDs quotes
	keep_quotes: false,
});

export const writeConfigToDisk = createAsyncThunk<void, string, { state: { config: SliceState } }>('config/write-config-to-disk', async (filePath, thunkAPI) => {
	try {
		console.debug('Dumping MyServers config back to file');

		// Get current state
		const { config: { api, local, notifier, remote, upc } } = thunkAPI.getState();

		// Stringify state
		const stringifiedData = serializer.serialize({ api, local, notifier, remote, upc });

		// Update config file
		await writeFile(filePath, stringifiedData);
	} catch (error: unknown) {
		if (!(error instanceof Error)) throw new Error(error as string);
		console.error('Failed writing config to disk with "%s"', error.message);
	}
});

export const loadConfigFile = createAsyncThunk<MyServersConfig, string>('config/load-config-file', async filePath => parseConfig<MyServersConfig>({
	filePath,
	type: 'ini',
}));

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
			state.status = 'loading';
		});
		builder.addCase(loadConfigFile.fulfilled, (state, action) => {
			merge(state, action.payload, { status: 'loaded' });
		});
	},
});

export const { updateUserConfig } = config.actions;
