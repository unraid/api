import { BadRequestException, ExecutionContext, Inject, Injectable, Optional } from '@nestjs/common';
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
import { isIP } from 'node:net';

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

    protected async getTracker(request: FastifyRequest): Promise<string> {
        const peerAddress = request.raw.socket.remoteAddress;
        if (peerAddress) return peerAddress;

        // Unix sockets have no peer IP. nginx overwrites this header with its TCP client address.
        const forwardedAddress = request.headers['x-forwarded-for'];
        if (typeof forwardedAddress === 'string' && isIP(forwardedAddress)) {
            return forwardedAddress;
        }

        throw new BadRequestException('Client IP address is unavailable');
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
