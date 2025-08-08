import { Global, Module } from '@nestjs/common';

import { SocketConfigService } from '@unraid/shared';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { GRAPHQL_PUBSUB_TOKEN } from '@unraid/shared/pubsub/graphql.pubsub.js';
import {
    API_KEY_SERVICE_TOKEN,
    INTERNAL_CLIENT_SERVICE_TOKEN,
    LIFECYCLE_SERVICE_TOKEN,
    NGINX_SERVICE_TOKEN,
    UPNP_CLIENT_TOKEN,
} from '@unraid/shared/tokens.js';

import { pubsub } from '@app/core/pubsub.js';
import { LifecycleService } from '@app/unraid-api/app/lifecycle.service.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { ApiKeyModule } from '@app/unraid-api/graph/resolvers/api-key/api-key.module.js';
import { NginxModule } from '@app/unraid-api/nginx/nginx.module.js';
import { NginxService } from '@app/unraid-api/nginx/nginx.service.js';
import { InternalGraphQLClientFactory } from '@app/unraid-api/shared/internal-graphql-client.factory.js';
import { upnpClient } from '@app/upnp/helpers.js';

// This is the actual module that provides the global dependencies
@Global()
@Module({
    imports: [ApiKeyModule, NginxModule],
    providers: [
        SocketConfigService,
        InternalGraphQLClientFactory,
        {
            provide: UPNP_CLIENT_TOKEN,
            useValue: upnpClient,
        },
        {
            provide: GRAPHQL_PUBSUB_TOKEN,
            useValue: pubsub,
        },
        {
            provide: API_KEY_SERVICE_TOKEN,
            useClass: ApiKeyService,
        },
        {
            provide: NGINX_SERVICE_TOKEN,
            useClass: NginxService,
        },
        {
            provide: INTERNAL_CLIENT_SERVICE_TOKEN,
            useClass: InternalGraphQLClientFactory,
        },
        PrefixedID,
        LifecycleService,
        {
            provide: LIFECYCLE_SERVICE_TOKEN,
            useExisting: LifecycleService,
        },
    ],
    exports: [
        SocketConfigService,
        UPNP_CLIENT_TOKEN,
        GRAPHQL_PUBSUB_TOKEN,
        API_KEY_SERVICE_TOKEN,
        NGINX_SERVICE_TOKEN,
        INTERNAL_CLIENT_SERVICE_TOKEN,
        PrefixedID,
        LIFECYCLE_SERVICE_TOKEN,
        LifecycleService,
    ],
})
class GlobalDepsCoreModule {}

// This is the module that will be imported by other modules
@Module({
    imports: [GlobalDepsCoreModule],
    exports: [GlobalDepsCoreModule],
})
export class GlobalDepsModule {}
