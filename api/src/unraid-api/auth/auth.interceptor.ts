import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const gqlContext = GqlExecutionContext.create(context);
        const req = gqlContext.getContext().req;
        console.log('in auth interceptor', req.user);
import { UnauthorizedException } from '@nestjs/common';
...
        if (!req.user) {
-            throw new Error('Unauthorized'); // Ensure authentication
+            throw new UnauthorizedException('User not authenticated');
        }

        return next.handle();
    }
}
