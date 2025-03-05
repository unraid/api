import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

import { UserSchema } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/operations.js';
import { UserAccount } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';

export const GraphqlUser = createParamDecorator<null, any, UserAccount>(
    (data: null, context: ExecutionContext): UserAccount => {
        if (context.getType<GqlContextType>() === 'graphql') {
            const ctx = GqlExecutionContext.create(context);
            const user = ctx.getContext().req.user;

            const result = UserSchema().safeParse(user);

            if (!result.success) {
                throw new Error('Invalid user account structure');
            }

            return result.data;
        } else {
            return context.switchToHttp().getRequest().user;
        }
    }
);
