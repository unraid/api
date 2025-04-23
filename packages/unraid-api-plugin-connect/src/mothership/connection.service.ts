import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { OutgoingHttpHeaders } from 'node:http2';

import type { ConnectionMetadata, MinigraphStatus, MyServersConfig } from '../config.entity.js';

interface MothershipWebsocketHeaders extends OutgoingHttpHeaders {
    'x-api-key': string;
    'x-flash-guid': string;
    'x-unraid-api-version': string;
    'x-unraid-server-version': string;
    'User-Agent': string;
}

enum ClientType {
    API = 'API',
    DASHBOARD = 'DASHBOARD',
}

interface MothershipConnectionParams extends Record<string, unknown> {
    clientType: ClientType;
    apiKey: string;
    flashGuid: string;
    apiVersion: string;
    unraidVersion: string;
}

interface IdentityState {
    unraidVersion: string;
    flashGuid: string;
    apiKey: string;
    apiVersion: string;
}

type ConnectionStatus =
    | {
          status: MinigraphStatus.CONNECTED | MinigraphStatus.CONNECTING | MinigraphStatus.PRE_INIT;
          error: null;
      }
    | {
          status: MinigraphStatus.ERROR_RETRYING | MinigraphStatus.PING_FAILURE;
          error: string;
      };

@Injectable()
export class MothershipConnectionService {
    private readonly logger = new Logger(MothershipConnectionService.name);
    private unraidVersion: string = '';
    private flashGuid: string = '';
    private apiVersion: string = '';

    constructor(private readonly configService: ConfigService) {}

    async onModuleInit() {
        // Crash on startup if these config values are not set
        this.unraidVersion = this.configService.getOrThrow('store.emhttp.var.version');
        this.flashGuid = this.configService.getOrThrow('store.emhttp.var.flashGuid');
        this.apiVersion = this.configService.getOrThrow('API_VERSION');
    }

    getIdentityState():
        | { state: IdentityState; isLoaded: true }
        | { state: Partial<IdentityState>; isLoaded: false } {
        const state = {
            unraidVersion: this.unraidVersion,
            flashGuid: this.flashGuid,
            apiVersion: this.apiVersion,
            apiKey: this.configService.get<MyServersConfig>('connect')?.apikey,
        };
        const isLoaded = Object.values(state).every(Boolean);
        return isLoaded ? { state: state as IdentityState, isLoaded: true } : { state, isLoaded: false };
    }

    getMothershipWebsocketHeaders(): OutgoingHttpHeaders | MothershipWebsocketHeaders {
        const { isLoaded, state } = this.getIdentityState();
        if (!isLoaded) {
            this.logger.debug('Incomplete identity state; cannot create websocket headers: %o', state);
            return {};
        }
        return {
            'x-api-key': state.apiKey,
            'x-flash-guid': state.flashGuid,
            'x-unraid-api-version': state.apiVersion,
            'x-unraid-server-version': state.unraidVersion,
            'User-Agent': `unraid-api/${state.apiVersion}`,
        } satisfies MothershipWebsocketHeaders;
    }

    getWebsocketConnectionParams(): MothershipConnectionParams | Record<string, unknown> {
        const { isLoaded, state } = this.getIdentityState();
        if (!isLoaded) {
            this.logger.debug(
                'Incomplete identity state; cannot create websocket connection params: %o',
                state
            );
            return {};
        }
        return {
            clientType: ClientType.API,
            ...state,
        } satisfies MothershipConnectionParams;
    }

    getConnectionState() {
        const state = this.configService.get<ConnectionMetadata>('connect.mothership');
        if (!state) {
            this.logger.error(
                'connect.mothership config is not present! Preventing fatal crash; mothership is in Error state.'
            );
        }
        return state;
    }

    setConnectionStatus({ status, error }: ConnectionStatus) {
        this.configService.set('connect.mothership.status', status);
        this.configService.set('connect.mothership.error', error);
    }

    receivePing() {
        this.configService.set('connect.mothership.lastPing', Date.now());
    }
}
