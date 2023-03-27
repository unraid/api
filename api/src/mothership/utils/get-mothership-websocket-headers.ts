import { API_VERSION } from '@app/environment';
import { ClientType } from '@app/graphql/generated/client/graphql';
import { isAPIStateDataFullyLoaded } from '@app/mothership/graphql-client';
import { store } from '@app/store';

import { type OutgoingHttpHeaders } from 'node:http2';

interface MothershipWebsocketHeaders extends OutgoingHttpHeaders {
	'x-api-key': string;
	'x-flash-guid': string;
	'x-unraid-api-version': string;
	'x-unraid-server-version': string;
}

export const getMothershipWebsocketHeaders = (state = store.getState()): MothershipWebsocketHeaders | OutgoingHttpHeaders => {
	const { config, emhttp } = state;

	if (isAPIStateDataFullyLoaded(state)) {
		const headers: MothershipWebsocketHeaders = {
			'x-api-key': config.remote.apikey,
			'x-flash-guid': emhttp.var.flashGuid,
			'x-unraid-api-version': API_VERSION,
			'x-unraid-server-version': emhttp.var.version,
		};
		return headers;
	}

	return {};
};

interface MothershipConnectionParams extends Record<string, unknown> {
	clientType: ClientType;
	apiKey: string;
	flashGuid: string;
	apiVersion: string;
	unraidVersion: string;
}

export const getMothershipConnectionParams = (state = store.getState()): MothershipConnectionParams | Record<string, unknown> => {
	const { config, emhttp } = state;
	if (isAPIStateDataFullyLoaded(state)) {
		return {
			clientType: ClientType.API,
			apiKey: config.remote.apikey,
			flashGuid: emhttp.var.flashGuid,
			apiVersion: API_VERSION,
			unraidVersion: emhttp.var.version,
		};
	}

	return {};
};
