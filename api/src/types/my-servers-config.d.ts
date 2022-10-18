import { HumanRelayStates } from '@app/graphql/relay-state';

export interface MyServersConfig {
	remote: {
		'2Fa'?: string;
		wanaccess?: string;
		wanport?: string;
		apikey?: string;
		email?: string;
		username?: string;
		avatar?: string;
	};
	local?: {
		'2Fa'?: string;
	};
	api?: {
		'extraOrigins'?: string;
	};
	upc: {
		apikey?: string;
	};
	notifier: {
		apikey?: string;
	};
	connectionStatus?: {
		minigraph: 'connected' | 'disconnected';
		relay: HumanRelayStates;
	};
}
