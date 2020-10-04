import * as Sentry from '@sentry/node';
import { MOTHERSHIP_GRAPHQL_LINK } from './consts';
import { CachedServer } from './cache';
import fetch from 'cross-fetch';

export const getServers = (apiKey: string) => fetch(MOTHERSHIP_GRAPHQL_LINK, {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
    body: JSON.stringify({
        query: 'query($apiKey: String!) { servers @auth(apiKey: $apiKey) { owner { username url avatar } guid apikey name status wanip lanip localurl remoteurl } }',
        variables: {
            apiKey
        }
    })
})
.then(async response => {
    const data = await response.json();
    return data.servers as Promise<CachedServer[]>;
})
.catch(error => {
    Sentry.captureException(error);
});