import { SliceState as ConfigSliceState, initialState } from '@app/store/modules/config';
import type { MyServersConfig, MyServersConfigMemory } from '@app/types/my-servers-config';

type ConfigType = 'flash' | 'memory';
type ConfigObject<T> =
	T extends 'flash' ? MyServersConfig :
		T extends 'memory' ? MyServersConfigMemory :
			never;
/**
 *
 * @param config Config to read from to create a new formatted server config to write
 * @param mode 'flash' or 'memory', changes what fields are included in the writeable payload
 * @returns
 */
// eslint-disable-next-line complexity
export const getWriteableConfig = <T extends ConfigType>(config: ConfigSliceState, mode: T): ConfigObject<T> => {
	// Get current state
	const { api, local, notifier, remote, upc, connectionStatus } = config;

	// Create new state
	// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
	const newState: ConfigObject<T> = {
		api: {
			version: api.version ?? initialState.api.version,
			...(api.extraOrigins ? { extraOrigins: api.extraOrigins } : {}),
		},
		local: {
			...(local['2Fa'] === 'yes' ? { '2Fa': local['2Fa'] } : {}),
			...(local.showT2Fa === 'yes' ? { showT2Fa: local.showT2Fa } : {}),
		},
		notifier: { apikey: notifier.apikey ?? initialState.notifier.apikey },
		remote: {
			...(remote['2Fa'] === 'yes' ? { '2Fa': remote['2Fa'] } : {}),
			wanaccess: remote.wanaccess ?? initialState.remote.wanaccess,
			wanport: remote.wanport ?? initialState.remote.wanport,
			...(remote['upnpEnabled'] === 'yes' ? { 'upnpEnabled': remote['upnpEnabled'] } : {}),
			apikey: remote.apikey ?? initialState.remote.apikey,
			email: remote.email ?? initialState.remote.email,
			username: remote.username ?? initialState.remote.username,
			avatar: remote.avatar ?? initialState.remote.avatar,
			regWizTime: remote.regWizTime ?? initialState.remote.regWizTime,
			idtoken: remote.idtoken ?? initialState.remote.idtoken,
			accesstoken: remote.accesstoken ?? initialState.remote.accesstoken,
			refreshtoken: remote.refreshtoken ?? initialState.remote.refreshtoken,
		},
		upc: {
			apikey: upc.apikey ?? initialState.upc.apikey,
		},
		...(mode === 'memory'
			? { connectionStatus: {
				minigraph: connectionStatus.minigraph ?? initialState.connectionStatus.minigraph,
				relay: connectionStatus.relay ?? initialState.connectionStatus.relay,
			} }
			: {}),
	} as ConfigObject<T>;
	return newState;
};
