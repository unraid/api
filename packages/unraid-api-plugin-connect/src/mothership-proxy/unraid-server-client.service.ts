import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { WebSocket } from 'ws';

import { MothershipConnectionService } from './connection.service.js';

/**
 * Unraid server client for connecting to the new mothership architecture
 * This handles GraphQL requests from the mothership and executes them using a local Apollo client
 */

interface GraphQLRequest {
  operationId: string
  type: 'query' | 'mutation' | 'subscription' | 'subscription_stop'
  payload: {
    query: string
    variables?: Record<string, any>
    operationName?: string
  }
}

interface GraphQLResponse {
  operationId: string
  type: 'data' | 'error' | 'complete'
  payload: any
}

interface GraphQLExecutor {
  execute(params: {
    query: string
    variables?: Record<string, any>
    operationName?: string
    operationType?: 'query' | 'mutation' | 'subscription'
  }): Promise<any>
  stopSubscription?(operationId: string): Promise<void>
}

class SimpleGraphQLExecutor implements GraphQLExecutor {
  private logger = new Logger('SimpleGraphQLExecutor');

  async execute(params: {
    query: string
    variables?: Record<string, any>
    operationName?: string
    operationType?: 'query' | 'mutation' | 'subscription'
  }): Promise<any> {
    const { query, variables, operationName, operationType } = params;

    try {
      this.logger.debug(`Executing ${operationType} operation: ${operationName || 'unnamed'}`);
      this.logger.verbose(`Query: ${query}`);
      this.logger.verbose(`Variables: ${JSON.stringify(variables)}`);

      // For now, return a simple success response
      // TODO: Implement actual GraphQL execution against local API
      return {
        data: {
          message: 'Operation executed successfully',
          operationType,
          operationName,
        },
      };
    } catch (error: any) {
      this.logger.error(`GraphQL execution error: ${error?.message}`);
      return {
        errors: [
          {
            message: error?.message || 'Unknown error',
            extensions: { code: 'EXECUTION_ERROR' },
          },
        ],
      };
    }
  }
}

export class UnraidServerClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000
  private pingInterval: NodeJS.Timeout | null = null

  constructor(
    private mothershipUrl: string,
    private apiKey: string,
    private executor: GraphQLExecutor,
  ) {}

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const wsUrl = `${this.mothershipUrl}/ws/server`
        this.ws = new WebSocket(wsUrl, [], {
          headers: {
            'X-API-Key': this.apiKey,
          },
        })

        this.ws.onopen = () => {
          console.log('Connected to mothership')
          this.reconnectAttempts = 0
          this.setupPingInterval()
          resolve()
        }

        this.ws.onmessage = (event) => {
          const data = typeof event.data === 'string' ? event.data : event.data.toString()
          this.handleGraphQLRequest(data)
        }

        this.ws.onclose = (event) => {
          console.log('Disconnected from mothership:', event.code, event.reason)
          this.clearPingInterval()
          this.scheduleReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          reject(error)
        }
      } catch (error) {
        reject(error)
      }
    })
  }

  private async handleGraphQLRequest(data: string) {
    try {
      const request: any = JSON.parse(data)

      // Handle ping/pong
      if (request.type === 'ping') {
        this.sendPong()
        return
      }

      // Convert to GraphQLRequest if it has the right structure
      if (!request.operationId || !request.type || !request.payload) {
        console.warn('Invalid GraphQL request format:', request)
        return
      }

      const graphqlRequest: GraphQLRequest = request;

      // Handle subscription stop
      if (graphqlRequest.type === 'subscription_stop') {
        // Handle subscription cleanup if needed
        if (this.executor.stopSubscription) {
          await this.executor.stopSubscription(graphqlRequest.operationId)
        }
        this.sendResponse({
          operationId: graphqlRequest.operationId,
          type: 'complete',
          payload: { data: null },
        })
        return
      }

      // Execute GraphQL operation using the provided executor
      const result = await this.executor.execute({
        query: graphqlRequest.payload.query,
        variables: graphqlRequest.payload.variables,
        operationName: graphqlRequest.payload.operationName,
        operationType: graphqlRequest.type,
      })

      // Send response back to mothership
      const response: GraphQLResponse = {
        operationId: graphqlRequest.operationId,
        type: result.errors ? 'error' : 'data',
        payload: result,
      }

      this.sendResponse(response)

      // For subscriptions, handle streaming
      if (graphqlRequest.type === 'subscription' && !result.errors) {
        // Note: Real subscription handling would require async iterators
        // This is a simplified example
        setTimeout(() => {
          this.sendResponse({
            operationId: graphqlRequest.operationId,
            type: 'complete',
            payload: { data: null },
          })
        }, 1000)
      }
    } catch (error: any) {
      console.error('Error handling GraphQL request:', error)

      // Send error response if possible
      try {
        const errorRequest = JSON.parse(data)
        this.sendResponse({
          operationId: errorRequest.operationId,
          type: 'error',
          payload: {
            errors: [
              {
                message: error?.message || 'Unknown error',
                extensions: { code: 'EXECUTION_ERROR' },
              },
            ],
          },
        })
      } catch (e) {
        console.error('Failed to send error response:', e)
      }
    }
  }

  private sendResponse(response: GraphQLResponse) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(response))
    }
  }

  private sendPong() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'pong',
          timestamp: Date.now(),
        }),
      )
    }
  }

  private setupPingInterval() {
    this.clearPingInterval()
    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(
          JSON.stringify({
            type: 'ping',
            timestamp: Date.now(),
          }),
        )
      }
    }, 30000)
  }

  private clearPingInterval() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval)
      this.pingInterval = null
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      setTimeout(
        () => {
          this.reconnectAttempts++
          console.log(
            `Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`,
          )
          this.connect().catch((error) => {
            console.error('Reconnection failed:', error)
          })
        },
        this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
      )
    } else {
      console.error('Max reconnection attempts reached')
    }
  }

  disconnect() {
    this.clearPingInterval()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }
}

@Injectable()
export class UnraidServerClientService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(UnraidServerClientService.name);
  private client: UnraidServerClient | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly connectionService: MothershipConnectionService,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async onModuleInit(): Promise<void> {
    // Initialize the client when the module starts
    await this.initializeClient();
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      this.client.disconnect();
      this.client = null;
    }
  }

  private async initializeClient(): Promise<void> {
    try {
      const mothershipUrl = this.configService.getOrThrow('MOTHERSHIP_BASE_URL');
      const identityState = this.connectionService.getIdentityState();
      
      if (!identityState.isLoaded || !identityState.state.apiKey) {
        this.logger.warn('No API key available, cannot initialize UnraidServerClient');
        return;
      }

      // Create simple GraphQL executor for now
      const executor = new SimpleGraphQLExecutor();

      this.client = new UnraidServerClient(
        mothershipUrl,
        identityState.state.apiKey,
        executor
      );

      await this.client.connect();
      this.logger.log('UnraidServerClient connected successfully');
    } catch (error) {
      this.logger.error('Failed to initialize UnraidServerClient:', error);
    }
  }

  getClient(): UnraidServerClient | null {
    return this.client;
  }

  async reconnect(): Promise<void> {
    if (this.client) {
      this.client.disconnect();
    }
    await this.initializeClient();
  }
}