import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

import { UserAccount } from '@app/graphql/generated/api/types';
import { isUserAccount } from '@app/utils';

export const GraphqlUser = createParamDecorator<null, any, UserAccount>(
    (data: null, context: ExecutionContext): UserAccount => {
        if (context.getType<GqlContextType>() === 'graphql') {
            const ctx = GqlExecutionContext.create(context);
            const user = ctx.getContext().req.user;

            if (!isUserAccount(user)) {
                throw new Error('Invalid user account structure');
            }
            return user;
        } else {
            return context.switchToHttp().getRequest().user;
        }
    }
);
