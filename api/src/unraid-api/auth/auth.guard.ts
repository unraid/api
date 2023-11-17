import { ServerHeaderStrategy } from '@app/unraid-api/auth/header.strategy';
import {
    type ExecutionContext,
    Injectable,
    Logger,
} from '@nestjs/common';
import { GqlExecutionContext, type GqlContextType } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { GraphQLError } from 'graphql';
import { type Observable } from 'rxjs';

@Injectable()
export class GraphqlAuthGuard extends AuthGuard([ServerHeaderStrategy.key]) {
    private readonly logger = new Logger(GraphqlAuthGuard.name);

    handleRequest(err, user, info, context) {
        if (!user) {
            if (context) {
                const ctx = GqlExecutionContext.create(context);
                const fullContext = ctx.getContext();
                this.logger.error(
                    'No user found in request - connection params: %o',
                    fullContext.connectionParams ?? {}
                );
            }
            throw new GraphQLError(
                `Could not find a user with that information. Please try again`
            );
        }

        return user;
    }

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        this.logger.debug('Can activate');
        return super.canActivate(context);
    }

    getRequest(context: ExecutionContext) {
        this.logger.debug('Getting request');
        if (context.getType<GqlContextType>() === 'graphql') {
            // headers are either inside context.getContext().connectionParams or in the request, which is in context.getContext().req (see context.ts)

            const ctx = GqlExecutionContext.create(context);
            const fullContext = ctx.getContext<any>();
            const request = fullContext.req;
            /*
            const additionalConnectionParamHeaders =
                fullContext.connectionParams
                    ? convertConnectionParamsToHeaders(
                          fullContext.connectionParams
                      )
                    : {};
                        */
            request.headers = {
                ...request.headers,
            };

            return request;
        }
        return context.switchToHttp().getRequest();
    }
}
