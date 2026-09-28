import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { APP_GUARD } from '@nestjs/core';
import {
    Field,
    GraphQLModule,
    Mutation,
    ObjectType,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import type { FastifyRequest } from 'fastify';
import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { UserSettingsService } from '@unraid/shared/services/user-settings.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';
import { PubSub } from 'graphql-subscriptions';
import { AUTHZ_ENFORCER, AuthZModule } from 'nest-authz';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { LifecycleService } from '@app/unraid-api/app/lifecycle.service.js';
import { Authenticated } from '@app/unraid-api/auth/authenticated.decorator.js';
import { AuthorizationGuard } from '@app/unraid-api/auth/authorization.guard.js';
import { CasbinService } from '@app/unraid-api/auth/casbin/casbin.service.js';
import { BASE_POLICY, CASBIN_MODEL } from '@app/unraid-api/auth/casbin/index.js';
import { Public } from '@app/unraid-api/auth/public.decorator.js';
import { NotificationsResolver } from '@app/unraid-api/graph/resolvers/notifications/notifications.resolver.js';
import { NotificationsService } from '@app/unraid-api/graph/resolvers/notifications/notifications.service.js';
import {
    SettingsResolver,
    SsoSettingsResolver,
    UnifiedSettingsResolver,
} from '@app/unraid-api/graph/resolvers/settings/settings.resolver.js';
import { ApiSettings } from '@app/unraid-api/graph/resolvers/settings/settings.service.js';
import { OidcConfigPersistence } from '@app/unraid-api/graph/resolvers/sso/core/oidc-config.service.js';
import {
    AuthorizationOperator,
    OidcProvider,
} from '@app/unraid-api/graph/resolvers/sso/models/oidc-provider.model.js';
import { OidcSessionService } from '@app/unraid-api/graph/resolvers/sso/session/oidc-session.service.js';
import { SsoResolver } from '@app/unraid-api/graph/resolvers/sso/sso.resolver.js';
import { UPSResolver } from '@app/unraid-api/graph/resolvers/ups/ups.resolver.js';
import { UPSService } from '@app/unraid-api/graph/resolvers/ups/ups.service.js';
import { getRequest } from '@app/utils.js';

const effect = vi.fn(() => true);

@ObjectType()
class AuthorizationProbe {
    @Field(() => Boolean)
    allowed!: boolean;

    @Field(() => Boolean)
    missing!: boolean;
}

@Resolver(() => AuthorizationProbe)
class AuthorizationProbeResolver {
    @Query(() => Boolean)
    unmarkedQuery() {
        return effect();
    }

    @Mutation(() => Boolean)
    unmarkedMutation() {
        return effect();
    }

    @Mutation(() => AuthorizationProbe)
    @Authenticated()
    probe() {
        return {};
    }

    @ResolveField(() => Boolean)
    @UsePermissions({ action: AuthAction.UPDATE_ANY, resource: Resource.ARRAY })
    allowed() {
        return effect();
    }

    @ResolveField(() => Boolean)
    missing() {
        return effect();
    }

    @Query(() => Boolean)
    @Public()
    publicProbe() {
        return true;
    }
}

type GraphQLResult = {
    data?: Record<string, unknown> | null;
    errors?: { extensions: { code: string } }[];
};

describe('GraphQL authorization boundary', () => {
    let app: NestFastifyApplication;
    const provider: OidcProvider = {
        id: 'test-provider',
        name: 'Test provider',
        clientId: 'test-client',
        clientSecret: 'synthetic-secret-for-authorization-test',
        scopes: ['openid'],
        authorizationRules: [
            { claim: 'email', operator: AuthorizationOperator.EQUALS, value: ['test@example.com'] },
        ],
    };
    const oidcConfig = {
        getProviders: vi.fn(async () => [provider]),
        getProvider: vi.fn(async () => provider),
        getConfig: vi.fn(async () => ({ providers: [provider] })),
    };
    const notifications = {
        archiveNotification: vi.fn(async () => ({ id: 'test-notification' })),
        getOverview: vi.fn(async () => ({ unread: { total: 0 } })),
        recalculateOverview: vi.fn(async () => ({ overview: { unread: { total: 0 } } })),
    };
    const ups = {
        configureUPS: vi.fn(async () => undefined),
        getUPSData: vi.fn(async () => ({ MODEL: 'test-ups' })),
    };
    const userSettings = {
        getAllValues: vi.fn(async () => ({ sso: { providers: [provider] } })),
    };

    beforeAll(async () => {
        const enforcer = await new CasbinService().initializeEnforcer(CASBIN_MODEL, BASE_POLICY);
        vi.stubGlobal('getServerIdentifier', () => 'test-server');
        await enforcer.addPolicy('array-update-only', Resource.ARRAY, AuthAction.UPDATE_ANY);
        const module = await Test.createTestingModule({
            imports: [
                AuthZModule.register({
                    enablePossession: false,
                    enforcerProvider: { provide: AUTHZ_ENFORCER, useValue: enforcer },
                    userFromContext: (context) => getRequest(context)?.user?.id ?? '',
                }),
                GraphQLModule.forRoot<ApolloDriverConfig>({
                    driver: ApolloDriver,
                    autoSchemaFile: true,
                    fieldResolverEnhancers: ['guards'],
                    context: (req: FastifyRequest) => {
                        const id = req.headers['x-api-key'];
                        return { req: { user: typeof id === 'string' ? { id } : undefined } };
                    },
                }),
            ],
            providers: [
                { provide: APP_GUARD, useClass: AuthorizationGuard },
                PrefixedID,
                NotificationsResolver,
                UPSResolver,
                SettingsResolver,
                UnifiedSettingsResolver,
                SsoSettingsResolver,
                SsoResolver,
                AuthorizationProbeResolver,
                { provide: NotificationsService, useValue: notifications },
                { provide: UPSService, useValue: ups },
                { provide: PubSub, useValue: new PubSub() },
                { provide: OidcConfigPersistence, useValue: oidcConfig },
                { provide: ApiSettings, useValue: {} },
                { provide: UserSettingsService, useValue: userSettings },
                { provide: LifecycleService, useValue: {} },
                { provide: OidcSessionService, useValue: {} },
            ],
        }).compile();
        app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });
    beforeEach(() => vi.clearAllMocks());
    afterAll(async () => {
        await app?.close();
        vi.unstubAllGlobals();
    });

    async function execute(query: string, key?: string): Promise<GraphQLResult> {
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            headers: key ? { 'x-api-key': key } : {},
            payload: { query },
        });
        expect(response.statusCode, response.body).toBe(200);
        return response.json<GraphQLResult>();
    }

    const protectedOperations = [
        'mutation { archiveNotification(id: "does-not-exist") { id } }',
        'mutation { recalculateOverview { unread { total } } }',
        'mutation { configureUps(config: {killUps: YES}) }',
        'query { settings { sso { oidcProviders { clientSecret } } } }',
        'query { settings { unified { values } } }',
        'query { oidcProviders { clientSecret } }',
        'query { oidcProvider(id: "test-provider") { clientSecret } }',
        'query { oidcConfiguration { providers { clientSecret } } }',
        'query { aliased: settings { ...Secrets } } fragment Secrets on Settings { sso { oidcProviders { clientSecret } } }',
    ];
    for (const query of protectedOperations) {
        it.each([Role.VIEWER, Role.GUEST])(`denies %s: ${query}`, async (role) => {
            const result = await execute(query, role);
            expect(result.errors?.[0].extensions.code).toBe('FORBIDDEN');
            for (const service of [notifications, ups, oidcConfig, userSettings]) {
                for (const method of Object.values(service)) expect(method).not.toHaveBeenCalled();
            }
            expect(JSON.stringify(result)).not.toContain(provider.clientSecret);
        });
        it(`allows ADMIN: ${query}`, async () => {
            const result = await execute(query, Role.ADMIN);
            expect(result.errors).toBeUndefined();
            expect(result.data).not.toBeNull();
        });
    }

    it.each([
        'query { unmarkedQuery }',
        'mutation { unmarkedMutation }',
        'mutation { probe { missing } }',
    ])('denies an unmarked handler for ADMIN: %s', async (query) => {
        expect((await execute(query, Role.ADMIN)).errors?.[0].extensions.code).toBe('FORBIDDEN');
        expect(effect).not.toHaveBeenCalled();
    });
    it('enforces nested mutation permissions while preserving narrowly scoped keys', async () => {
        expect(
            (await execute('mutation { probe { allowed } }', Role.VIEWER)).errors?.[0].extensions.code
        ).toBe('FORBIDDEN');
        expect(effect).not.toHaveBeenCalled();
        expect((await execute('mutation { probe { allowed } }', 'array-update-only')).data).toEqual({
            probe: { allowed: true },
        });
        expect(effect).toHaveBeenCalledOnce();
    });
    it('does not permit unauthenticated mutation namespaces', async () => {
        expect((await execute('mutation { probe { __typename } }')).errors?.[0].extensions.code).toBe(
            'FORBIDDEN'
        );
    });
    it('preserves VIEWER monitoring and nested notification reads', async () => {
        const result = await execute(
            'query { upsDevices { id } notifications { overview { unread { total } } } }',
            Role.VIEWER
        );
        expect(result.errors).toBeUndefined();
        expect(notifications.getOverview).toHaveBeenCalledOnce();
        expect(ups.getUPSData).toHaveBeenCalledOnce();
    });
    it('preserves public login information without exposing provider secrets', async () => {
        const result = await execute(
            'query { isSSOEnabled publicOidcProviders { id name } publicProbe }'
        );
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            isSSOEnabled: true,
            publicOidcProviders: [{ id: 'test-provider', name: 'Test provider' }],
            publicProbe: true,
        });
        expect(JSON.stringify(result)).not.toContain(provider.clientSecret);
    });
});
