import { Global, Module } from '@nestjs/common';

import { GRAPHQL_PUBSUB_TOKEN } from '@unraid/shared/pubsub/graphql.pubsub.js';
import { API_KEY_SERVICE_TOKEN, UPNP_CLIENT_TOKEN } from '@unraid/shared/tokens.js';

import { pubsub } from '@app/core/pubsub.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { ApiKeyModule } from '@app/unraid-api/graph/resolvers/api-key/api-key.module.js';
import { upnpClient } from '@app/upnp/helpers.js';

// This is the actual module that provides the global dependencies
@Global()
@Module({
    imports: [ApiKeyModule],
    providers: [
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
    ],
    exports: [UPNP_CLIENT_TOKEN, GRAPHQL_PUBSUB_TOKEN, API_KEY_SERVICE_TOKEN],
})
class GlobalDepsCoreModule {}

// This is the module that will be imported by other modules
@Module({
    imports: [GlobalDepsCoreModule],
    exports: [GlobalDepsCoreModule],
})
export class GlobalDepsModule {}
