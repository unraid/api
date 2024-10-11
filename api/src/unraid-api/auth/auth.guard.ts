import { apiLogger } from '@app/core/log';
import { ServerHeaderStrategy } from '@app/unraid-api/auth/header.strategy';
import { IS_PUBLIC_KEY } from '@app/unraid-api/auth/public.decorator';
import {
    type ExecutionContext,
    Injectable,
    type CanActivate,
    UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext, type GqlContextType } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { type Observable } from 'rxjs';
import { UserCookieStrategy } from './cookie.strategy';

@Injectable()
export class GraphqlAuthGuard
    extends AuthGuard([ServerHeaderStrategy.key, UserCookieStrategy.key])
    implements CanActivate
{
    constructor(private readonly reflector: Reflector) {
        super();
    }

    handleRequest<UserAccount>(err, user: UserAccount | null, info, context) {
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
    canActivate(
        context: ExecutionContext
    ): boolean | Promise<boolean> | Observable<boolean> {
        const isPublic = this.reflector.getAllAndOverride<boolean>(
            IS_PUBLIC_KEY,
            [context.getHandler(), context.getClass()]
        );

        if (isPublic) {
            return true;
        }

        return super.canActivate(context);
    }

    getRequest(context: ExecutionContext) {
        if (context.getType<GqlContextType>() === 'graphql') {
            // headers are either inside context.getContext().connectionParams or in the request, which is in context.getContext().req (see context.ts)
            const ctx = GqlExecutionContext.create(context);
            const fullContext = ctx.getContext<any>();
            const request = fullContext.req ?? {};
            const additionalConnectionParamHeaders =
                fullContext.connectionParams ?? {};
            request.headers = {
                ...(request.headers ?? {}),
                ...additionalConnectionParamHeaders,
            };

            return request;
        } else {
            return context.switchToHttp().getRequest();
        }
    }
}
