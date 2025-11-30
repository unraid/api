import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import type { OutgoingHttpHeaders } from 'node:http2';

import { isEqual } from 'lodash-es';
import { Subscription } from 'rxjs';
import { debounceTime, filter } from 'rxjs/operators';

import { ConnectionMetadata, MinigraphStatus } from '../config/connect.config.js';
import { EVENTS } from '../helper/nest-tokens.js';

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
export class MothershipConnectionService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(MothershipConnectionService.name);
    private readonly configKeys = {
        unraidVersion: 'store.emhttp.var.version',
        flashGuid: 'store.emhttp.var.flashGuid',
        apiVersion: 'API_VERSION',
        apiKey: 'connect.config.apikey',
    };

    private identitySubscription: Subscription | null = null;
    private lastIdentity: Partial<IdentityState> | null = null;
    private metadataChangedSubscription: Subscription | null = null;

    constructor(
        private readonly configService: ConfigService,
        private readonly eventEmitter: EventEmitter2
    ) {}

    private updateMetadata(data: Partial<ConnectionMetadata>) {
        this.configService.set('connect.mothership', {
            ...this.configService.get<ConnectionMetadata>('connect.mothership'),
            ...data,
        });
    }

    private setMetadata(data: ConnectionMetadata) {
        this.configService.set('connect.mothership', data);
    }

    private setupIdentitySubscription() {
        if (this.identitySubscription) {
            this.identitySubscription.unsubscribe();
        }
        this.identitySubscription = this.configService.changes$
            .pipe(
                filter((change) => Object.values(this.configKeys).includes(change.path)),
                // debouncing is necessary here (instead of buffering/batching) to prevent excess emissions
                // because the store.* config values will change frequently upon api boot
                debounceTime(25)
            )
            .subscribe({
                next: () => {
                    const { state } = this.getIdentityState();
                    if (isEqual(state, this.lastIdentity)) {
                        this.logger.debug('Identity unchanged; skipping event emission');
                        return;
                    }
                    this.lastIdentity = structuredClone(state);
                    const success = this.eventEmitter.emit(EVENTS.IDENTITY_CHANGED);
                    if (success) {
                        this.logger.debug('Emitted IDENTITY_CHANGED event');
                    } else {
                        this.logger.warn('Failed to emit IDENTITY_CHANGED event');
                    }
                },
                error: (err) => {
                    this.logger.error('Error in identity state subscription: %o', err);
                },
            });
    }

    private setupMetadataChangedEvent() {
        if (this.metadataChangedSubscription) {
            this.metadataChangedSubscription.unsubscribe();
        }
        this.metadataChangedSubscription = this.configService.changes$
            .pipe(filter((change) => change.path.startsWith('connect.mothership')))
            .subscribe({
                next: () => {
                    const success = this.eventEmitter.emit(EVENTS.MOTHERSHIP_CONNECTION_STATUS_CHANGED);
                    if (!success) {
                        this.logger.warn('Failed to emit METADATA_CHANGED event');
                    }
                },
                error: (err) => {
                    this.logger.error('Error in metadata changed subscription: %o', err);
                },
            });
    }

    async onModuleInit() {
        // Warn on startup if these config values are not set initially
        const { unraidVersion, flashGuid, apiVersion } = this.configKeys;
        const warnings: string[] = [];
        [unraidVersion, flashGuid, apiVersion].forEach((key) => {
            try {
                this.configService.getOrThrow(key);
            } catch (error) {
                warnings.push(`${key} is not set`);
            }
        });
        if (warnings.length > 0) {
            this.logger.warn('Missing config values: %s', warnings.join(', '));
        }
        // Setup IDENTITY_CHANGED & METADATA_CHANGED events
        this.setupIdentitySubscription();
        this.setupMetadataChangedEvent();
    }

    async onModuleDestroy() {
        if (this.identitySubscription) {
            this.identitySubscription.unsubscribe();
            this.identitySubscription = null;
        }
        if (this.metadataChangedSubscription) {
            this.metadataChangedSubscription.unsubscribe();
            this.metadataChangedSubscription = null;
        }
    }

    getApiKey() {
        return this.configService.get<string>(this.configKeys.apiKey);
    }

    /**
     * Fetches the current identity state directly from ConfigService.
     */
    getIdentityState():
        | { state: IdentityState; isLoaded: true }
        | { state: Partial<IdentityState>; isLoaded: false } {
        const state = {
            unraidVersion: this.configService.get<string>(this.configKeys.unraidVersion),
            flashGuid: this.configService.get<string>(this.configKeys.flashGuid),
            apiVersion: this.configService.get<string>(this.configKeys.apiVersion),
            apiKey: this.configService.get<string>(this.configKeys.apiKey),
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
        this.updateMetadata({ status, error });
    }

    resetMetadata() {
        this.setMetadata({ status: MinigraphStatus.PRE_INIT });
    }

    receivePing() {
        this.updateMetadata({ lastPing: Date.now() });
    }

    clearDisconnectedTimestamp() {
        return this.updateMetadata({ selfDisconnectedSince: null });
    }

    setDisconnectedTimestamp() {
        return this.updateMetadata({ selfDisconnectedSince: Date.now() });
    }
}
