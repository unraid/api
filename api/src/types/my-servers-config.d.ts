import { type MinigraphStatus } from '@app/graphql/generated/api/types';

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
		allowedOrigins?: string;
	};
	upc: {
		apikey: string;
	};
}

export interface MyServersConfigWithMandatoryHiddenFields extends MyServersConfig {
	api: {
		extraOrigins: string;
	};
	local: MyServersConfig['local'] & {
		'2Fa': string;
		'showT2Fa': string;
	};
	remote: MyServersConfig['remote'] & {
		'2Fa': string;
		upnpEnabled: string;
	};
}

export interface MyServersConfigMemory extends MyServersConfig {
	connectionStatus: {
		minigraph: MinigraphStatus;
		upnpStatus?: null | string;
	};
	remote: MyServersConfig['remote'] & {
		allowedOrigins: string;
	};
}

export interface MyServersConfigMemoryWithMandatoryHiddenFields extends MyServersConfigMemoryWithMandatoryHiddenFields {
	connectionStatus: {
		minigraph: MinigraphStatus;
		upnpStatus?: null | string;
	};
}

