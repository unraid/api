import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { GqlContextType } from '@nestjs/graphql';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';

import { type Observable } from 'rxjs';

import { apiLogger } from '@app/core/log';
import { ServerHeaderStrategy } from '@app/unraid-api/auth/header.strategy';

import { UserCookieStrategy } from './cookie.strategy';
import { parseCookies } from '@app/utils';

@Injectable()
export class GraphqlAuthGuard
    extends AuthGuard([ServerHeaderStrategy.key, UserCookieStrategy.key])
    implements CanActivate
{
    protected logger = new Logger(GraphqlAuthGuard.name);
    constructor() {
        super();
    }

    handleRequest<UserAccount>(err, user: UserAccount | null, info, context) {
        if (err) {
            this.logger.error('Error in handleRequest', err);
            throw err;
        }
        if (!user) {
            if (context) {
                const ctx = GqlExecutionContext.create(context);
                const fullContext = ctx.getContext();
                apiLogger.error(
                    'No user found in request - connection params: %o',
                    fullContext.connectionParams ?? {}
                );
            }
            throw new UnauthorizedException('User not found');
        }

        return user;
    }

    /**
     * Helper to determine if this middleware should run activate. If the route is marked as public, then it will not run.
     * @param context
     * @returns
     */
    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        return super.canActivate(context);
    }

    getRequest(context: ExecutionContext) {
        if (context.getType<GqlContextType>() === 'graphql') {
            // headers are either inside context.getContext().connectionParams or in the request, which is in context.getContext().req (see context.ts)
            const ctx = GqlExecutionContext.create(context);
            const fullContext = ctx.getContext<any>();
            const request = fullContext.req ?? {};
            const additionalConnectionParamHeaders = fullContext.connectionParams ?? {};
            request.headers = {
                ...(request.headers ?? {}),
                ...additionalConnectionParamHeaders,
            };
            
            // parse cookies from raw headers on initial web socket connection request
            if (fullContext.connectionParams) {
                const rawHeaders: string[] = request.extra.request.rawHeaders;
                const headerIndex = rawHeaders.findIndex((headerOrValue) => headerOrValue === "Cookie")
                const cookieString = rawHeaders[headerIndex + 1]
                request.cookies = parseCookies(cookieString);
            }

            return request;
        } else {
            return context.switchToHttp().getRequest();
        }
    }
}
