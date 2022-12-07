import type { HumanRelayStates } from '@app/graphql/relay-state';

interface MyServersConfig {
	api: {
		version: string;
		extraOrigins?: string;
	};
	local: {
		'2Fa'?: string;
		'showT2Fa'?: string;
	};
	notifier: {
		apikey: string;
	};
	remote: {
		'2Fa'?: string;
		wanaccess: string;
		wanport: string;
		upnpEnabled?: string;
		apikey: string;
		email: string;
		username: string;
		avatar: string;
		regWizTime: string;
		accesstoken: string;
		idtoken: string;
		refreshtoken: string;
	};
	upc: {
		apikey: string;
	};
}

interface MyServersConfigWithMandatoryHiddenFields extends MyServersConfig {
	api: {
		extraOrigins: string;
	};
	local: {
		'2Fa': string;
		'showT2Fa': string;
	};
	remote: {
		'2Fa': string;
		upnpEnabled: string;
	};
}

export interface MyServersConfigMemory extends MyServersConfig {
	connectionStatus: {
		minigraph: 'connected' | 'disconnected';
		relay: HumanRelayStates;
		upnpError?: null | string;
	};
}

export interface MyServersConfigMemoryWithMandatoryHiddenFields extends MyServersConfigMemoryWithMandatoryHiddenFields {
	connectionStatus: {
		minigraph: 'connected' | 'disconnected';
		relay: HumanRelayStates;
		upnpError: null | string;
	};
}

