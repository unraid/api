import WebSocket from 'ws';
import { MOTHERSHIP_GRAPHQL_LINK } from '@app/consts';
import { apiManager } from '@app/core/api-manager';
import { mothershipLogger } from '@app/core/log';
import { getRelayHeaders } from '@app/mothership/utils/get-relay-headers';
import { getters } from '@app/store';
import { Client, createClient, ExecutionResult, SubscribePayload } from 'graphql-ws';
import { sleep } from '@app/core/utils/misc/sleep'
import { bus } from '@app/core/bus';

class WebsocketWithRelayHeaders extends WebSocket {
	constructor(address, protocols) {
		super(address, protocols, {
			headers: getRelayHeaders(),
		});
	}
}

type MinigraphStatus = 'CONNECTING' | 'CONNECTED' | 'ERROR' | 'DISCONNECTED' | 'RETRY_WAITING'

interface MinigraphClientState {
        status: MinigraphStatus
        error: unknown
        retryTimeout: number | null
}

export class MinigraphClient {
	private static client: Client | null = null
    private static clientState: MinigraphClientState = {
        status: 'DISCONNECTED',
        error: null,
        retryTimeout: 0
    }
    private constructor() { 
        // Initialize this with getClient call to create new client on creation
        MinigraphClient.getClient()
    }

    private static setClientState = (newState: MinigraphStatus) => {
        bus.emit('minigraph-state', newState)
        MinigraphClient.clientState.status = newState
    }
    
    private static createClient = () => {
        const client =  createClient({
            url: MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'),
            webSocketImpl: WebsocketWithRelayHeaders,
            connectionParams: () => ({
                apiVersion: getters.config().version,
                apiKey: apiManager.cloudKey,
            }),
            shouldRetry: (evt) => {
                return true
            },
            retryAttempts: Infinity,
            retryWait: async (retries) => { await sleep(retries * 1000) },
        })
        client.on('connecting', () => {
            MinigraphClient.setClientState('CONNECTING')

        })
        client.on('connected', () => {
            MinigraphClient.setClientState('CONNECTED')
            mothershipLogger.info('Connected to %s', MOTHERSHIP_GRAPHQL_LINK.replace('http', 'ws'));
        })
        client.on('error', (error) => {
            MinigraphClient.setClientState('ERROR')
            mothershipLogger.error('Error in MinigraphClient', error);
        })
        client.on('closed', () => {
            MinigraphClient.setClientState('DISCONNECTED')
            mothershipLogger.debug('MinigraphClient closed connection');
        })
        return client
    }

    public static getClient(): Client {
        if (!MinigraphClient.client) {
            MinigraphClient.client = MinigraphClient.createClient()
        }
        return MinigraphClient.client
    }

    public static query = async (query: SubscribePayload): Promise<any> => {
        return new Promise((resolve, reject) => {
          let result: ExecutionResult<Record<string, unknown>, unknown>;
          MinigraphClient.getClient().subscribe(
            query,
            {
              next: (data) => (result = data),
              error: reject,
              complete: () => resolve(result),
            },
          );
        });
    }
}
