import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';

import { ConnectApiKeyService } from '../authn/connect-api-key.service.js';
import { CloudResolver } from '../connection-status/cloud.resolver.js';
import { CloudService } from '../connection-status/cloud.service.js';
import { TimeoutCheckerJob } from '../connection-status/timeout-checker.job.js';
import { InternalClientService } from '../internal-rpc/internal.client.js';
import { RemoteAccessModule } from '../remote-access/remote-access.module.js';
import { MothershipConnectionService } from './connection.service.js';
import { MothershipWebSocketClient } from './mothership-websocket-client.js';
import { MothershipSubscriptionHandlerV2 } from './mothership-subscription-handler-v2.js';
import { MothershipServiceV2 } from './mothership-service-v2.js';
import { MothershipHandler } from './mothership.events.js';
import { MothershipGraphqlClientService } from './graphql.client.js';
import { MothershipSubscriptionHandler } from './mothership-subscription.handler.js';
import { MothershipFallbackService } from './mothership-fallback.service.js';

/**
 * Updated Mothership module with fallback support
 * Supports both new WebSocket architecture and legacy GraphQL-WS
 */
@Module({
    imports: [RemoteAccessModule, ConfigModule, ScheduleModule],
    providers: [
        // Core connection services
        ConnectApiKeyService,
        MothershipConnectionService,
        
        // V2 WebSocket client architecture
        MothershipWebSocketClient,
        MothershipSubscriptionHandlerV2,
        MothershipServiceV2,
        
        // Legacy GraphQL client architecture
        MothershipGraphqlClientService,
        MothershipSubscriptionHandler,
        
        // Fallback service that manages both
        MothershipFallbackService,
        
        // Event handlers (separate from service dependencies)
        MothershipHandler,
        
        // Internal services
        InternalClientService,
        
        // Monitoring and health checks
        TimeoutCheckerJob,
        CloudService,
        CloudResolver,
    ],
    exports: [
        // Primary export: fallback service
        MothershipFallbackService,
        
        // Individual services for specific use cases
        MothershipServiceV2,
        MothershipGraphqlClientService,
        MothershipWebSocketClient,
        MothershipConnectionService,
    ],
})
export class MothershipModule {}
