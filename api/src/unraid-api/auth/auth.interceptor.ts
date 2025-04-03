import {
    CallHandler,
    ExecutionContext,
    Injectable,
    NestInterceptor,
    UnauthorizedException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const gqlContext = GqlExecutionContext.create(context);
        const req = gqlContext.getContext().req;
        console.log('in auth interceptor', req.user);

        if (!req.user) {
            throw new UnauthorizedException('User not authenticated');
        }

        return next.handle();
    }
}
