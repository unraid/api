import { UserAccount } from '@app/graphql/generated/api/types';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';

export const GraphqlUser = createParamDecorator<null, any, UserAccount>(
    (data: null, context: ExecutionContext): UserAccount => {
        if (context.getType<GqlContextType>() === 'graphql') {
            const ctx = GqlExecutionContext.create(context);
            return ctx.getContext().req.user as any;
        } else {
            return context.switchToHttp().getRequest().user;
        }
    }
);