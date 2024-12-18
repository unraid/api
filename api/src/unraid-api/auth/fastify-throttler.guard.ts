import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';

import { type FastifyRequest } from 'fastify';

@Injectable()
export class FastifyThrottlerGuard extends ThrottlerGuard {
    protected async getTracker(req: Record<string, any>): Promise<string> {
        const request = req as unknown as FastifyRequest;
        return request.ip ?? request.ips?.[0] ?? request.headers?.['x-forwarded-for'] ?? '0.0.0.0';
    }

    getRequestResponse(context: ExecutionContext) {
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
