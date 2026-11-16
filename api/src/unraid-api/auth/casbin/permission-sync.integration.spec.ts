import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { GraphQLModule, Query, Resolver } from '@nestjs/graphql';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test } from '@nestjs/testing';

import type { Enforcer } from 'casbin';
import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import { PrefixedID } from '@unraid/shared/prefixed-id-scalar.js';
import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';
import { AUTHZ_ENFORCER, AuthZModule, AuthZService } from 'nest-authz';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { AuthService } from '@app/unraid-api/auth/auth.service.js';
import { AuthorizationGuard } from '@app/unraid-api/auth/authorization.guard.js';
import { CasbinService } from '@app/unraid-api/auth/casbin/casbin.service.js';
import { BASE_POLICY, CASBIN_MODEL } from '@app/unraid-api/auth/casbin/index.js';
import { CookieService } from '@app/unraid-api/auth/cookie.service.js';
import { LocalSessionService } from '@app/unraid-api/auth/local-session.service.js';
import { ApiKey } from '@app/unraid-api/graph/resolvers/api-key/api-key.model.js';
import { getRequest } from '@app/utils.js';

@Injectable()
class PermissionSyncGuard implements CanActivate {
    constructor(private readonly auth: AuthService) {}

    async canActivate(context: ExecutionContext) {
        const request = getRequest(context);
        request.user = await this.auth.validateApiKeyCasbin(String(request.headers['x-api-key']));
        return true;
    }
}

@Resolver()
class PermissionProbeResolver {
    @Query(() => Boolean, { nullable: true })
    @UsePermissions({ resource: Resource.NOTIFICATIONS, action: AuthAction.READ_ANY })
    notificationsProbe() {
        return true;
    }

    @Query(() => Boolean, { nullable: true })
    @UsePermissions({ resource: Resource.DOCKER, action: AuthAction.READ_ANY })
    dockerProbe() {
        return true;
    }

    @Query(() => Boolean, { nullable: true })
    @UsePermissions({ resource: Resource.VMS, action: AuthAction.READ_ANY })
    vmsProbe() {
        return true;
    }

    @Query(() => Boolean, { nullable: true })
    @UsePermissions({ resource: Resource.DOCKER, action: AuthAction.DELETE_ANY })
    deleteProbe() {
        return true;
    }
}

describe('Concurrent custom API key authorization', () => {
    let app: NestFastifyApplication;
    let enforcer: Enforcer;
    let auth: AuthService;
    let key: ApiKey;

    beforeEach(async () => {
        key = {
            id: 'custom-permission-key',
            key: 'synthetic-key',
            name: 'Concurrent test',
            roles: [Role.GUEST],
            createdAt: new Date().toISOString(),
            permissions: [Resource.NOTIFICATIONS, Resource.DOCKER, Resource.VMS].map((resource) => ({
                resource,
                actions: [AuthAction.READ_ANY],
            })),
        };
        enforcer = await new CasbinService().initializeEnforcer(CASBIN_MODEL, BASE_POLICY);
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
                    context: ({ req }) => ({ req }),
                }),
            ],
            providers: [
                AuthService,
                PermissionProbeResolver,
                PrefixedID,
                { provide: ApiKeyService, useValue: { findByKey: vi.fn(async () => key) } },
                { provide: CookieService, useValue: {} },
                { provide: LocalSessionService, useValue: {} },
                { provide: APP_GUARD, useClass: PermissionSyncGuard },
                { provide: APP_GUARD, useClass: AuthorizationGuard },
            ],
        }).compile();
        auth = module.get(AuthService);
        app = module.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
        await app.init();
        await app.getHttpAdapter().getInstance().ready();
    });

    afterEach(async () => {
        vi.restoreAllMocks();
        await app?.close();
    });

    async function execute(query: string) {
        const response = await app.inject({
            method: 'POST',
            url: '/graphql',
            headers: { 'x-api-key': key.key },
            payload: { query },
        });
        expect(response.statusCode).toBe(200);
        return response.json<{
            data: Record<string, boolean | null>;
            errors?: { extensions: { code: string } }[];
        }>();
    }

    it('preserves grants and denials across parallel fields and repeated HTTP requests', async () => {
        for (let round = 0; round < 4; round++) {
            const results = await Promise.all(
                Array.from({ length: 12 }, () =>
                    execute('{ notificationsProbe dockerProbe vmsProbe deleteProbe }')
                )
            );
            for (const result of results) {
                expect(result.data).toEqual({
                    notificationsProbe: true,
                    dockerProbe: true,
                    vmsProbe: true,
                    deleteProbe: null,
                });
                expect(result.errors).toHaveLength(1);
                expect(result.errors?.[0].extensions.code).toBe('FORBIDDEN');
            }
        }
    });

    it('does not remove an existing grant while refreshing an unchanged key', async () => {
        await auth.validateApiKeyCasbin(key.key);
        const authz = app.get(AuthZService);
        const remove = vi.spyOn(authz, 'deletePermissionsForUser');
        const removeOne = vi.spyOn(authz, 'deletePermissionForUser');
        const add = vi.spyOn(authz, 'addPermissionForUser');
        await Promise.all(Array.from({ length: 12 }, () => auth.validateApiKeyCasbin(key.key)));
        expect(remove).not.toHaveBeenCalled();
        expect(removeOne).not.toHaveBeenCalled();
        expect(add).not.toHaveBeenCalled();
    });

    it('applies permission removal and new grants on the next authenticated request', async () => {
        await auth.validateApiKeyCasbin(key.key);
        key.permissions = [{ resource: Resource.DOCKER, actions: [AuthAction.DELETE_ANY] }];
        const result = await execute('{ notificationsProbe dockerProbe vmsProbe deleteProbe }');
        expect(result.data).toEqual({
            notificationsProbe: null,
            dockerProbe: null,
            vmsProbe: null,
            deleteProbe: true,
        });
        expect(result.errors).toHaveLength(3);
        expect(result.errors?.every((error) => error.extensions.code === 'FORBIDDEN')).toBe(true);
    });

    it('finishes an in-flight check before removing policy rows, then denies the revoked grant', async () => {
        await auth.validateApiKeyCasbin(key.key);
        let entered!: () => void;
        let release!: () => void;
        const checking = new Promise<void>((resolve) => {
            entered = resolve;
        });
        const proceed = new Promise<void>((resolve) => {
            release = resolve;
        });
        const roles = enforcer.getRoleManager();
        const hasLink = roles.hasLink.bind(roles);
        vi.spyOn(roles, 'hasLink').mockImplementationOnce(async (...args) => {
            entered();
            await proceed;
            return hasLink(...args);
        });
        const decision = enforcer.enforce(key.id, Resource.VMS, AuthAction.READ_ANY);
        // Observe rejection immediately so the baseline failure cannot leak an unhandled rejection.
        const observed = decision.then(
            (value) => ({ value }),
            (error) => ({ error })
        );
        await checking;
        const removal = enforcer.deletePermissionsForUser(key.id);
        await new Promise<void>((resolve) => setImmediate(resolve));
        release();
        expect(await observed).toEqual({ value: true });
        await removal;
        await expect(enforcer.enforce(key.id, Resource.VMS, AuthAction.READ_ANY)).resolves.toBe(false);
    });

    it('retains wildcard expansion and removes every custom grant for an empty permission set', async () => {
        // @ts-expect-error Legacy persisted wildcard actions predate the current GraphQL enum.
        await auth.syncApiKeyPermissions(key.id, [{ resource: Resource.DOCKER, actions: ['*'] }]);
        await expect(enforcer.enforce(key.id, Resource.DOCKER, AuthAction.READ_ANY)).resolves.toBe(true);
        await expect(enforcer.enforce(key.id, Resource.DOCKER, AuthAction.DELETE_ANY)).resolves.toBe(
            true
        );
        await auth.syncApiKeyPermissions(key.id, []);
        await expect(enforcer.enforce(key.id, Resource.DOCKER, AuthAction.READ_ANY)).resolves.toBe(
            false
        );
        await expect(enforcer.enforce(key.id, Resource.DOCKER, AuthAction.DELETE_ANY)).resolves.toBe(
            false
        );
    });

    it('releases synchronization after a failed check so later requests still authorize', async () => {
        await auth.validateApiKeyCasbin(key.key);
        vi.spyOn(enforcer.getRoleManager(), 'hasLink').mockRejectedValueOnce(
            new Error('role lookup failure')
        );
        await expect(enforcer.enforce(key.id, Resource.VMS, AuthAction.READ_ANY)).rejects.toThrow();
        await expect(enforcer.enforce(key.id, Resource.VMS, AuthAction.READ_ANY)).resolves.toBe(true);
    });
});
