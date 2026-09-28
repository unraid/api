import { ExecutionContext, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host.js';

import type { Enforcer } from 'casbin';
import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import { BatchApproval, PERMISSIONS_METADATA } from 'nest-authz';
import { beforeAll, describe, expect, it } from 'vitest';

import { AuthorizationGuard } from '@app/unraid-api/auth/authorization.guard.js';
import { CasbinService } from '@app/unraid-api/auth/casbin/casbin.service.js';
import { CASBIN_MODEL } from '@app/unraid-api/auth/casbin/model.js';
import { BASE_POLICY } from '@app/unraid-api/auth/casbin/policy.js';
import { resolveSubjectFromUser } from '@app/unraid-api/auth/casbin/resolve-subject.util.js';
import { DockerMutationsResolver } from '@app/unraid-api/graph/resolvers/docker/docker.mutations.resolver.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { FlashBackupResolver } from '@app/unraid-api/graph/resolvers/flash-backup/flash-backup.resolver.js';
import { NotificationsResolver } from '@app/unraid-api/graph/resolvers/notifications/notifications.resolver.js';
import {
    SettingsResolver,
    SsoSettingsResolver,
    UnifiedSettingsResolver,
} from '@app/unraid-api/graph/resolvers/settings/settings.resolver.js';
import { SsoResolver } from '@app/unraid-api/graph/resolvers/sso/sso.resolver.js';
import { UPSResolver } from '@app/unraid-api/graph/resolvers/ups/ups.resolver.js';
import { VmMutationsResolver } from '@app/unraid-api/graph/resolvers/vms/vms.mutations.resolver.js';
import { MeResolver } from '@app/unraid-api/graph/user/user.resolver.js';
import { getRequest } from '@app/utils.js';

type Handler = (...args: never[]) => unknown;

type TestUser = {
    id?: string;
    roles?: Role[];
};

type TestRequest = {
    user?: TestUser;
};

function createExecutionContext(
    handler: Handler,
    classRef: Type<unknown> | null,
    roles: Role[],
    userId = 'api-key-viewer'
): ExecutionContext {
    const request: TestRequest = {
        user: {
            id: userId,
            roles: [...roles],
        },
    };

    const graphqlContextHost = new ExecutionContextHost(
        [undefined, undefined, { req: request }, undefined],
        classRef,
        handler
    );

    graphqlContextHost.setType('graphql');

    return graphqlContextHost as unknown as ExecutionContext;
}

describe('AuthZGuard + Casbin policies', () => {
    let guard: AuthorizationGuard;
    let enforcer: Enforcer;

    beforeAll(async () => {
        const casbinService = new CasbinService();
        enforcer = await casbinService.initializeEnforcer(CASBIN_MODEL, BASE_POLICY);

        await enforcer.addGroupingPolicy('api-key-viewer', Role.VIEWER);
        await enforcer.addGroupingPolicy('api-key-admin', Role.ADMIN);
        await enforcer.addGroupingPolicy('api-key-guest', Role.GUEST);

        guard = new AuthorizationGuard(new Reflector(), enforcer, {
            enablePossession: false,
            batchApproval: BatchApproval.ALL,
            userFromContext: (ctx: ExecutionContext) => {
                const request = getRequest(ctx) as TestRequest | undefined;

                return resolveSubjectFromUser(request?.user);
            },
        });
    });

    it('denies viewer role from stopping docker containers', async () => {
        const context = createExecutionContext(
            DockerMutationsResolver.prototype.stop,
            DockerMutationsResolver,
            [Role.VIEWER],
            'api-key-viewer'
        );

        await expect(guard.canActivate(context)).resolves.toBe(false);
    });

    it('allows admin role to stop docker containers', async () => {
        const context = createExecutionContext(
            DockerMutationsResolver.prototype.stop,
            DockerMutationsResolver,
            [Role.ADMIN],
            'api-key-admin'
        );

        await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('denies viewer role from stopping virtual machines', async () => {
        const context = createExecutionContext(
            VmMutationsResolver.prototype.stop,
            VmMutationsResolver,
            [Role.VIEWER],
            'api-key-viewer'
        );

        await expect(guard.canActivate(context)).resolves.toBe(false);
    });

    it('allows viewer role to read docker data', async () => {
        const context = createExecutionContext(
            DockerResolver.prototype.containers,
            DockerResolver,
            [Role.VIEWER],
            'api-key-viewer'
        );

        await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('allows API key with explicit permission to access ME resource', async () => {
        await enforcer.addPolicy('api-key-custom', Resource.ME, AuthAction.READ_ANY);

        const context = createExecutionContext(
            MeResolver.prototype.me,
            MeResolver,
            [],
            'api-key-custom'
        );

        await expect(guard.canActivate(context)).resolves.toBe(true);
    });
    const protectedHandlers: [Type<unknown>, Handler, Resource, AuthAction][] = [
        ...(['createNotification', 'notifyIfUnique'] as const).map(
            (name): [Type<unknown>, Handler, Resource, AuthAction] => [
                NotificationsResolver,
                NotificationsResolver.prototype[name],
                Resource.NOTIFICATIONS,
                AuthAction.CREATE_ANY,
            ]
        ),
        ...(['deleteNotification', 'deleteArchivedNotifications'] as const).map(
            (name): [Type<unknown>, Handler, Resource, AuthAction] => [
                NotificationsResolver,
                NotificationsResolver.prototype[name],
                Resource.NOTIFICATIONS,
                AuthAction.DELETE_ANY,
            ]
        ),
        ...(
            [
                'archiveNotification',
                'archiveNotifications',
                'archiveAll',
                'unreadNotification',
                'unarchiveNotifications',
                'unarchiveAll',
                'recalculateOverview',
            ] as const
        ).map((name): [Type<unknown>, Handler, Resource, AuthAction] => [
            NotificationsResolver,
            NotificationsResolver.prototype[name],
            Resource.NOTIFICATIONS,
            AuthAction.UPDATE_ANY,
        ]),
        [UPSResolver, UPSResolver.prototype.configureUps, Resource.CONFIG, AuthAction.UPDATE_ANY],
        [
            FlashBackupResolver,
            FlashBackupResolver.prototype.initiateFlashBackup,
            Resource.FLASH,
            AuthAction.CREATE_ANY,
        ],
        [
            UnifiedSettingsResolver,
            UnifiedSettingsResolver.prototype.values,
            Resource.CONFIG,
            AuthAction.UPDATE_ANY,
        ],
        [
            SsoSettingsResolver,
            SsoSettingsResolver.prototype.oidcProviders,
            Resource.CONFIG,
            AuthAction.UPDATE_ANY,
        ],
        [SsoResolver, SsoResolver.prototype.oidcProviders, Resource.CONFIG, AuthAction.UPDATE_ANY],
        [SsoResolver, SsoResolver.prototype.oidcProvider, Resource.CONFIG, AuthAction.UPDATE_ANY],
        [SsoResolver, SsoResolver.prototype.oidcConfiguration, Resource.CONFIG, AuthAction.UPDATE_ANY],
    ];

    for (const [resolver, handler, resource, action] of protectedHandlers) {
        describe(`${resolver.name}.${handler.name}`, () => {
            it.each([Role.VIEWER, Role.GUEST])('denies %s before the service runs', async (role) => {
                const context = createExecutionContext(
                    handler,
                    resolver,
                    [role],
                    `api-key-${role.toLowerCase()}`
                );
                await expect(guard.canActivate(context)).resolves.toBe(false);
            });
            it('allows ADMIN', async () => {
                await expect(
                    guard.canActivate(
                        createExecutionContext(handler, resolver, [Role.ADMIN], 'api-key-admin')
                    )
                ).resolves.toBe(true);
            });
            it('requires the matching permission for a roleless key', async () => {
                const id = `scoped-${resolver.name}-${handler.name}`;
                const context = createExecutionContext(handler, resolver, [], id);
                await expect(guard.canActivate(context)).resolves.toBe(false);
                await enforcer.addPolicy(id, resource, action);
                await expect(guard.canActivate(context)).resolves.toBe(true);
            });
        });
    }

    it('denies missing permission metadata even for ADMIN', async () => {
        const handler = () => true;
        await expect(
            guard.canActivate(createExecutionContext(handler, null, [Role.ADMIN], 'api-key-admin'))
        ).resolves.toBe(false);
    });

    it.each([
        [UPSResolver, UPSResolver.prototype.upsDevices],
        [UPSResolver, UPSResolver.prototype.upsDeviceById],
        [UPSResolver, UPSResolver.prototype.upsConfiguration],
        [UPSResolver, UPSResolver.prototype.upsUpdates],
        [SettingsResolver, SettingsResolver.prototype.settings],
        [NotificationsResolver, NotificationsResolver.prototype.overview],
    ] satisfies [Type<unknown>, Handler][])(
        'allows VIEWER and denies GUEST on %s.%s reads',
        async (resolver, handler) => {
            await expect(
                guard.canActivate(
                    createExecutionContext(handler, resolver, [Role.VIEWER], 'api-key-viewer')
                )
            ).resolves.toBe(true);
            await expect(
                guard.canActivate(
                    createExecutionContext(handler, resolver, [Role.GUEST], 'api-key-guest')
                )
            ).resolves.toBe(false);
        }
    );

    it('denies an empty permission list', async () => {
        const handler = () => true;
        Reflect.defineMetadata(PERMISSIONS_METADATA, [], handler);
        await expect(
            guard.canActivate(createExecutionContext(handler, null, [Role.ADMIN], 'api-key-admin'))
        ).resolves.toBe(false);
    });

    it('preserves existing REST authorization behavior', async () => {
        const context = new ExecutionContextHost([], null, () => true);
        context.setType('http');
        await expect(guard.canActivate(context)).resolves.toBe(true);
    });

    it('denies a CONFIG read-only key access to secret-bearing queries', async () => {
        await enforcer.addPolicy('config-reader', Resource.CONFIG, AuthAction.READ_ANY);
        for (const [resolver, handler, resource] of protectedHandlers) {
            if (resource !== Resource.CONFIG) continue;
            await expect(
                guard.canActivate(createExecutionContext(handler, resolver, [], 'config-reader'))
            ).resolves.toBe(false);
        }
    });
});
