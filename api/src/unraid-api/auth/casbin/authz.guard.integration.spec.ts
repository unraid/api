import { ExecutionContext, Type } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host.js';

import type { Enforcer } from 'casbin';
import { AuthAction, Resource, Role } from '@unraid/shared/graphql.model.js';
import { AuthZGuard, BatchApproval } from 'nest-authz';
import { beforeAll, describe, expect, it } from 'vitest';

import { CasbinService } from '@app/unraid-api/auth/casbin/casbin.service.js';
import { CASBIN_MODEL } from '@app/unraid-api/auth/casbin/model.js';
import { BASE_POLICY } from '@app/unraid-api/auth/casbin/policy.js';
import { resolveSubjectFromUser } from '@app/unraid-api/auth/casbin/resolve-subject.util.js';
import { DockerMutationsResolver } from '@app/unraid-api/graph/resolvers/docker/docker.mutations.resolver.js';
import { DockerResolver } from '@app/unraid-api/graph/resolvers/docker/docker.resolver.js';
import { VmMutationsResolver } from '@app/unraid-api/graph/resolvers/vms/vms.mutations.resolver.js';
import { MeResolver } from '@app/unraid-api/graph/user/user.resolver.js';
import { getRequest } from '@app/utils.js';

type Handler = (...args: any[]) => unknown;

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
    let guard: AuthZGuard;
    let enforcer: Enforcer;

    beforeAll(async () => {
        const casbinService = new CasbinService();
        enforcer = await casbinService.initializeEnforcer(CASBIN_MODEL, BASE_POLICY);

        await enforcer.addGroupingPolicy('api-key-viewer', Role.VIEWER);
        await enforcer.addGroupingPolicy('api-key-admin', Role.ADMIN);

        guard = new AuthZGuard(new Reflector(), enforcer, {
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
});
