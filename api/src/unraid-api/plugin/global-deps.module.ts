import { Global, Module } from '@nestjs/common';

import { SocketConfigService } from '@unraid/shared';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { GRAPHQL_PUBSUB_TOKEN } from '@unraid/shared/pubsub/graphql.pubsub.js';
import {
    API_KEY_SERVICE_TOKEN,
    CANONICAL_INTERNAL_CLIENT_TOKEN,
    COOKIE_SERVICE_TOKEN,
    INTERNAL_CLIENT_SERVICE_TOKEN,
    LIFECYCLE_SERVICE_TOKEN,
    NGINX_SERVICE_TOKEN,
    UPNP_CLIENT_TOKEN,
} from '@unraid/shared/tokens.js';

import { pubsub } from '@app/core/pubsub.js';
import { LifecycleService } from '@app/unraid-api/app/lifecycle.service.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { CookieService, SESSION_COOKIE_CONFIG } from '@app/unraid-api/auth/cookie.service.js';
import { LocalSessionService } from '@app/unraid-api/auth/local-session.service.js';
import { ApiKeyModule } from '@app/unraid-api/graph/resolvers/api-key/api-key.module.js';
import { NginxModule } from '@app/unraid-api/nginx/nginx.module.js';
import { NginxService } from '@app/unraid-api/nginx/nginx.service.js';
import { InternalClientService } from '@app/unraid-api/shared/internal-client.service.js';
import { InternalGraphQLClientFactory } from '@app/unraid-api/shared/internal-graphql-client.factory.js';
import { upnpClient } from '@app/upnp/helpers.js';

// This is the actual module that provides the global dependencies
@Global()
@Module({
    imports: [ApiKeyModule, NginxModule],
    providers: [
        SocketConfigService,
        {
            provide: INTERNAL_CLIENT_SERVICE_TOKEN,
            useClass: InternalGraphQLClientFactory,
        },
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
            provide: SESSION_COOKIE_CONFIG,
            useValue: CookieService.defaultOpts(),
        },
        {
            provide: COOKIE_SERVICE_TOKEN,
            useClass: CookieService,
        },
        {
            provide: NGINX_SERVICE_TOKEN,
            useClass: NginxService,
        },
        // Canonical internal client service
        LocalSessionService,
        InternalClientService,
        {
            provide: CANONICAL_INTERNAL_CLIENT_TOKEN,
            useExisting: InternalClientService,
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
        COOKIE_SERVICE_TOKEN,
        NGINX_SERVICE_TOKEN,
        INTERNAL_CLIENT_SERVICE_TOKEN,
        CANONICAL_INTERNAL_CLIENT_TOKEN,
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
