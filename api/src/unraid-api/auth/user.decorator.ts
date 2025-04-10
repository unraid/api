import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

import { UserAccount } from '@app/unraid-api/graph/user/user.model.js';

export const GraphqlUser = createParamDecorator<null, UserAccount>(
    (data: null, context: ExecutionContext): UserAccount => {
        if (context.getType<GqlContextType>() === 'graphql') {
            const ctx = GqlExecutionContext.create(context);
            const user = ctx.getContext().req.user;
            return user;
        } else {
            return context.switchToHttp().getRequest().user;
        }
    }
);
