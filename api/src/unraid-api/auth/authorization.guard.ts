import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlContextType } from '@nestjs/graphql';

import type { Permission } from 'nest-authz';
import { AuthZGuard, PERMISSIONS_METADATA } from 'nest-authz';

import { IS_AUTHENTICATED_ENDPOINT_KEY } from '@app/unraid-api/auth/authenticated.decorator.js';
import { IS_PUBLIC_ENDPOINT_KEY } from '@app/unraid-api/auth/public.decorator.js';
import { getRequest } from '@app/utils.js';

@Injectable()
export class AuthorizationGuard extends AuthZGuard {
    override async canActivate(context: ExecutionContext): Promise<boolean> {
        if (context.getType<GqlContextType>() !== 'graphql') {
            return super.canActivate(context);
        }

        const handler = context.getHandler();
        const permissions = this.reflector.get<Permission[]>(PERMISSIONS_METADATA, handler);
        if (permissions !== undefined) {
            return Array.isArray(permissions) && permissions.length > 0
                ? super.canActivate(context)
                : false;
        }
        if (this.reflector.get<boolean>(IS_PUBLIC_ENDPOINT_KEY, handler)) {
            return true;
        }
        if (this.reflector.get<boolean>(IS_AUTHENTICATED_ENDPOINT_KEY, handler)) {
            return Boolean(getRequest(context)?.user);
        }
        return false;
    }
}
