import { fetch } from './common/fetch';
import { MOTHERSHIP_GRAPHQL_LINK } from './consts';
import { CachedServer } from './cache';
import { version } from '../package.json';
import { logger } from './core';
import { GraphQLError } from 'graphql';

export const getServers = async (apiKey: string) => {
	try {
		const response = await fetch(MOTHERSHIP_GRAPHQL_LINK, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Accept: 'application/json',
				'x-unraid-api-version': version,
				'x-api-key': apiKey
			},
			body: JSON.stringify({
				query: 'query($apiKey: String!) { servers @auth(apiKey: $apiKey) { owner { username url avatar } guid apikey name status wanip lanip localurl remoteurl } }',
				variables: {
					apiKey
				}
			})
		});

		const { data, errors } = await response.json() as { data: { servers: CachedServer[] }; errors?: GraphQLError[] };
		if (errors) {
			throw new Error(errors[0].message);
		}

		return data.servers;
	} catch (error: unknown) {
		logger.addContext('error', error);
		logger.error('Failed getting servers');
		logger.removeContext('error');
		return [];
	}
};
