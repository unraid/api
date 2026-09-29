import { ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
    getOptionsToken,
    InjectThrottlerStorage,
    ThrottlerGuard,
    ThrottlerModuleOptions,
    ThrottlerStorage,
    ThrottlerStorageService,
} from '@nestjs/throttler';

import { type FastifyRequest } from 'fastify';

@Injectable()
export class FastifyThrottlerGuard extends ThrottlerGuard {
    constructor(
        @Optional() @Inject(getOptionsToken()) options: ThrottlerModuleOptions | undefined,
        @Optional() @InjectThrottlerStorage() storageService: ThrottlerStorage | undefined,
        reflector: Reflector
    ) {
        super(
            options ?? [{ ttl: 10000, limit: 100 }],
            storageService ?? new ThrottlerStorageService(),
            reflector
        );
    }

    protected async getTracker(req: Record<string, any>): Promise<string> {
        const request = req as unknown as FastifyRequest;
        return request.ip ?? request.ips?.[0] ?? request.headers?.['x-forwarded-for'] ?? '0.0.0.0';
    }

    getRequestResponse(context: ExecutionContext) {
        if (context.getType() === 'http') {
            const httpContext = context.switchToHttp();
            return {
                req: httpContext.getRequest(),
                res: httpContext.getResponse(),
            };
        }

        const gqlContext = GqlExecutionContext.create(context);
        const ctx = gqlContext.getContext();

        if (!ctx.res) {
            ctx.res = {
                headers: {},
                header: function (name: string, value: string) {
                    this.headers[name] = value;
                    return this;
                },
            };
        } else if (!ctx.res.header && ctx.res.headers) {
            ctx.res.header = function (name: string, value: string) {
                this.headers[name] = value;
                return this;
            };
        }

        return {
            req: ctx.req,
            res: ctx.res,
        };
    }
}
