import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import WebSocket from 'ws';

import { MinigraphStatus } from '../config/connect.config.js';
import { EVENTS } from '../helper/nest-tokens.js';
import { MothershipConnectionService } from './connection.service.js';

interface WebSocketMessage {
    type: string;
    payload?: any;
    id?: string;
}

interface SubscriptionMessage extends WebSocketMessage {
    type: 'subscribe' | 'unsubscribe';
    id: string;
}

@Injectable()
export class MothershipWebSocketClient implements OnModuleDestroy {
    private readonly logger = new Logger(MothershipWebSocketClient.name);
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private readonly maxReconnectAttempts = 5;
    private readonly reconnectDelayMs = 1000;
    private connectionUrl: string;
    private isConnecting = false;

    constructor(
        private readonly connectionService: MothershipConnectionService,
        private readonly eventEmitter: EventEmitter2
    ) {
        this.connectionUrl = process.env.MOTHERSHIP_WS_URL || 'wss://mothership.unraid.net/ws';
    }

    async onModuleDestroy() {
        await this.disconnect();
    }

    async connect(): Promise<void> {
        if (this.isConnecting || this.isConnected()) {
            this.logger.debug('Already connected or connecting');
            return;
        }

        this.isConnecting = true;
        
        try {
            const headers = this.connectionService.getMothershipWebsocketHeaders();
            const params = this.connectionService.getWebsocketConnectionParams();
            
            if (!headers || Object.keys(headers).length === 0) {
                throw new Error('Invalid WebSocket headers');
            }

            this.connectionService.setConnectionStatus({
                status: MinigraphStatus.CONNECTING,
                error: null
            });

            const queryString = new URLSearchParams(params as Record<string, string>).toString();
            const wsUrl = `${this.connectionUrl}?${queryString}`;

            this.logger.debug(`Connecting to WebSocket: ${this.connectionUrl}`);
            
            this.ws = new WebSocket(wsUrl, { headers });
            this.setupEventHandlers();
            
            await this.waitForConnection();
            
        } catch (error) {
            this.isConnecting = false;
            this.logger.error(`WebSocket connection failed: ${error}`);
            this.connectionService.setConnectionStatus({
                status: MinigraphStatus.ERROR_RETRYING,
                error: error instanceof Error ? error.message : 'Unknown connection error'
            });
            throw error;
        }
    }

    private async waitForConnection(): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.ws) {
                reject(new Error('WebSocket not initialized'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('WebSocket connection timeout'));
            }, 10000);

            this.ws.once('open', () => {
                clearTimeout(timeout);
                resolve();
            });

            this.ws.once('error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });
    }

    private setupEventHandlers(): void {
        if (!this.ws) return;

        this.ws.on('open', () => {
            this.logger.debug('WebSocket connected');
            this.isConnecting = false;
            this.reconnectAttempts = 0;
            this.connectionService.setConnectionStatus({
                status: MinigraphStatus.CONNECTED,
                error: null
            });
            this.eventEmitter.emit(EVENTS.MOTHERSHIP_CONNECTION_STATUS_CHANGED);
        });

        this.ws.on('message', (data: WebSocket.Data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleMessage(message);
            } catch (error) {
                this.logger.error(`Failed to parse WebSocket message: ${error}`);
            }
        });

        this.ws.on('close', (code: number, reason: Buffer) => {
            this.logger.debug(`WebSocket closed: ${code} - ${reason.toString()}`);
            this.ws = null;
            this.isConnecting = false;
            
            if (code !== 1000) { // Not a normal closure
                this.connectionService.setConnectionStatus({
                    status: MinigraphStatus.ERROR_RETRYING,
                    error: `WebSocket closed with code ${code}`
                });
                this.scheduleReconnect();
            }
        });

        this.ws.on('error', (error: Error) => {
            this.logger.error(`WebSocket error: ${error.message}`);
            this.connectionService.setConnectionStatus({
                status: MinigraphStatus.ERROR_RETRYING,
                error: error.message
            });
        });

        this.ws.on('ping', () => {
            this.logger.debug('Received ping');
            this.connectionService.receivePing();
        });

        this.ws.on('pong', () => {
            this.logger.debug('Received pong');
            this.connectionService.receivePing();
        });
    }

    private handleMessage(message: WebSocketMessage): void {
        this.logger.debug(`Received message: ${message.type}`);

        switch (message.type) {
            case 'ping':
                this.connectionService.receivePing();
                this.send({ type: 'pong' });
                break;
            case 'pong':
                this.connectionService.receivePing();
                break;
            case 'subscription_data':
                this.eventEmitter.emit('mothership.subscription.data', message);
                break;
            case 'error':
                this.logger.error(`Server error: ${JSON.stringify(message.payload)}`);
                break;
            default:
                this.logger.debug(`Unhandled message type: ${message.type}`);
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.logger.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached`);
            return;
        }

        const delay = this.reconnectDelayMs * Math.pow(2, this.reconnectAttempts);
        this.reconnectAttempts++;
        
        this.logger.debug(`Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
        
        setTimeout(() => {
            this.connect().catch(error => {
                this.logger.error(`Reconnection failed: ${error}`);
            });
        }, delay);
    }

    async disconnect(): Promise<void> {
        if (this.ws) {
            this.ws.close(1000, 'Normal closure');
            this.ws = null;
        }
        this.isConnecting = false;
        this.connectionService.setDisconnectedTimestamp();
    }

    isConnected(): boolean {
        return this.ws?.readyState === WebSocket.OPEN;
    }

    send(message: WebSocketMessage): void {
        if (!this.isConnected()) {
            this.logger.warn('Cannot send message: WebSocket not connected');
            return;
        }

        try {
            this.ws!.send(JSON.stringify(message));
            this.logger.debug(`Sent message: ${message.type}`);
        } catch (error) {
            this.logger.error(`Failed to send message: ${error}`);
        }
    }

    async subscribe(subscription: SubscriptionMessage): Promise<void> {
        if (!this.isConnected()) {
            await this.connect();
        }
        
        this.send({
            type: 'subscribe',
            id: subscription.id,
            payload: subscription.payload
        });
    }

    async unsubscribe(subscriptionId: string): Promise<void> {
        if (!this.isConnected()) {
            this.logger.warn('Cannot unsubscribe: WebSocket not connected');
            return;
        }
        
        this.send({
            type: 'unsubscribe',
            id: subscriptionId
        });
    }

    ping(): void {
        if (this.isConnected()) {
            this.ws!.ping();
        }
    }
}