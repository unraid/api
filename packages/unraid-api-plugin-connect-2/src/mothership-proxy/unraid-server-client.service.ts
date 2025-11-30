import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { WebSocket } from 'ws';

import { MothershipConnectionService } from './connection.service.js';
import { LocalGraphQLExecutor } from './local-graphql-executor.service.js';

/**
 * Unraid server client for connecting to the new mothership architecture
 * This handles GraphQL requests from the mothership and executes them using a local Apollo client
 */



interface GraphQLResponse {
  operationId: string
  messageId?: string
  event: 'query_response'
  type: 'data' | 'error' | 'complete'
  payload: any
  requestHash?: string
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


export class UnraidServerClient {
  private ws: WebSocket | null = null
  private reconnectAttempts = 0
  private readonly initialReconnectDelay = 1000 // 1 second
  private readonly maxReconnectDelay = 30 * 60 * 1000 // 30 minutes
  private pingInterval: NodeJS.Timeout | null = null
  private reconnectTimeout: NodeJS.Timeout | null = null
  private shouldReconnect = true

  constructor(
    private mothershipUrl: string,
    private apiKey: string,
    private executor: GraphQLExecutor,
  ) {}

  async connect(): Promise<void> {
    this.shouldReconnect = true
    
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
          
          if (this.shouldReconnect) {
            this.scheduleReconnect()
          } else {
            console.log('Reconnection disabled, not scheduling reconnect')
          }
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
      // Handle plaintext ping/pong messages first
      if (data.trim() === 'ping') {
        this.sendPong()
        return
      }
      
      if (data.trim() === 'pong') {
        console.log('Received pong from mothership')
        return
      }

      // Try to parse as JSON for structured messages
      let message: any
      try {
        message = JSON.parse(data)
      } catch (parseError) {
        // Not valid JSON, could be other plaintext message
        console.log('Received non-JSON message from mothership:', data.trim())
        return
      }

      // Handle JSON ping/pong messages (fallback)
      if (message.type === 'ping' || message.ping) {
        this.sendPong()
        return
      }
      
      if (message.type === 'pong' || message.pong || JSON.stringify(message) === '"pong"') {
        console.log('Received pong from mothership')
        return
      }

      // Handle new event-based GraphQL requests
      if (message.event === 'remote_query' || message.event === 'subscription_start' || message.event === 'subscription_stop') {
        await this.handleNewFormatGraphQLRequest(message)
        return
      }
      
      // Handle messages routed from RouterDO
      if (message.event === 'route_message') {
        await this.handleRouteMessage(message)
        return
      }

      // Handle request type messages (legacy format)
      if (message.type === 'request') {
        await this.handleRequestMessage(message)
        return
      }

      // Handle unknown message types
      console.warn('Unknown message event received from mothership:', message.event || message.type, JSON.stringify(message).substring(0, 200))
    } catch (error: any) {
      console.error('Error handling GraphQL request:', error)

      // Send error response if possible
      try {
        const errorRequest = JSON.parse(data)
        // Only send error response for GraphQL requests that have operationId
        if (errorRequest.operationId && (errorRequest.event === 'remote_query' || errorRequest.event === 'route_message')) {
          const operationId = errorRequest.operationId || `error-${Date.now()}`
          this.sendResponse({
            operationId,
            event: 'query_response',
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
        }
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
      // Send plaintext pong response
      this.ws.send('pong')
    }
  }

  private setupPingInterval() {
    this.clearPingInterval()
    // Send ping every 30 seconds to keep connection alive
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        // Send plaintext ping
        this.ws.send('ping')
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
    if (!this.shouldReconnect) {
      console.log('Reconnection disabled, not scheduling reconnect')
      return
    }

    this.reconnectAttempts++
    
    // Calculate exponential backoff delay: 1s, 2s, 4s, 8s, 16s, 32s, etc.
    // Cap at maxReconnectDelay (30 minutes)
    const exponentialDelay = this.initialReconnectDelay * Math.pow(2, this.reconnectAttempts - 1)
    const delay = Math.min(exponentialDelay, this.maxReconnectDelay)
    
    console.log(
      `Scheduling reconnection attempt ${this.reconnectAttempts} in ${delay / 1000}s (${Math.floor(delay / 60000)}m ${Math.floor((delay % 60000) / 1000)}s)`
    )
    
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
    }
    
    this.reconnectTimeout = setTimeout(
      () => {
        if (!this.shouldReconnect) {
          console.log('Reconnection disabled, skipping attempt')
          return
        }
        
        console.log(`Reconnection attempt ${this.reconnectAttempts}`)
        this.connect().catch((error) => {
          console.error('Reconnection failed:', error)
          // Schedule next reconnection attempt
          this.scheduleReconnect()
        })
      },
      delay
    )
  }

  private async handleNewFormatGraphQLRequest(message: any) {
    if (!message.payload || !message.payload.query) {
      console.warn('Invalid GraphQL request - missing payload or query:', message)
      return
    }

    const operationId = message.operationId || `auto-${Date.now()}`
    const messageId = message.messageId || `msg_${operationId}_${Date.now()}`

    // Handle subscription stop
    if (message.event === 'subscription_stop') {
      if (this.executor.stopSubscription) {
        await this.executor.stopSubscription(operationId)
      }
      this.sendResponse({
        operationId,
        messageId,
        event: 'query_response',
        type: 'complete',
        payload: { data: null },
      })
      return
    }

    // Execute GraphQL operation for remote_query and subscription_start events
    if (message.event === 'remote_query' || message.event === 'subscription_start') {
      try {
        const operationType = message.event === 'subscription_start' ? 'subscription' : 'query'
        const result = await this.executor.execute({
          query: message.payload.query,
          variables: message.payload.variables,
          operationName: message.payload.operationName,
          operationType,
        })

        // Send response back to mothership
        const response: GraphQLResponse = {
          operationId,
          messageId: `msg_response_${Date.now()}`,
          event: 'query_response',
          type: result.errors ? 'error' : 'data',
          payload: result,
        }

        this.sendResponse(response)
      } catch (error: any) {
        this.sendResponse({
          operationId,
          messageId: `msg_error_${Date.now()}`,
          event: 'query_response',
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
      }
    }
  }

  private async handleRouteMessage(message: any) {
    if (!message.payload || !message.payload.query) {
      console.warn('Invalid route message - missing payload or query:', message)
      return
    }

    const operationId = message.operationId || `auto-${Date.now()}`

    try {
      const result = await this.executor.execute({
        query: message.payload.query,
        variables: message.payload.variables,
        operationName: message.payload.operationName,
        operationType: 'query',
      })

      // Send response back to mothership
      const response: GraphQLResponse = {
        operationId,
        messageId: `msg_response_${Date.now()}`,
        event: 'query_response',
        type: result.errors ? 'error' : 'data',
        payload: result,
      }

      this.sendResponse(response)
    } catch (error: any) {
      this.sendResponse({
        operationId,
        messageId: `msg_error_${Date.now()}`,
        event: 'query_response',
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
    }
  }

  private async handleRequestMessage(message: any) {
    if (!message.payload || !message.payload.query) {
      console.warn('Invalid request message - missing payload or query:', message)
      return
    }

    const operationId = message.operationId || `auto-${Date.now()}`

    try {
      const result = await this.executor.execute({
        query: message.payload.query,
        variables: message.payload.variables,
        operationName: message.payload.operationName,
        operationType: 'query',
      })

      // Send response back to mothership
      const response: GraphQLResponse = {
        operationId,
        messageId: `msg_response_${Date.now()}`,
        event: 'query_response',
        type: result.errors ? 'error' : 'data',
        payload: result,
      }

      this.sendResponse(response)
    } catch (error: any) {
      this.sendResponse({
        operationId,
        messageId: `msg_error_${Date.now()}`,
        event: 'query_response',
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
    }
  }

  disconnect() {
    this.shouldReconnect = false
    this.clearPingInterval()
    
    // Clear any pending reconnection attempts
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    
    console.log('Disconnected from mothership (reconnection disabled)')
  }
}

@Injectable()
export class UnraidServerClientService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(UnraidServerClientService.name);
  private client: UnraidServerClient | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly connectionService: MothershipConnectionService,
    private readonly localExecutor: LocalGraphQLExecutor
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
      const mothershipUrl = this.configService.getOrThrow('MOTHERSHIP_GRAPHQL_LINK');
      const identityState = this.connectionService.getIdentityState();
      
      if (!identityState.isLoaded || !identityState.state.apiKey) {
        this.logger.warn('No API key available, cannot initialize UnraidServerClient');
        return;
      }

      // Use the injected LocalGraphQLExecutor
      const executor = this.localExecutor;

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
