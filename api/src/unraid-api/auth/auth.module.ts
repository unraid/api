import { ExecutionContext, Logger, Module, UnauthorizedException } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';

import { AUTHZ_ENFORCER, AuthZModule } from 'nest-authz';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service';
import { AuthService } from '@app/unraid-api/auth/auth.service';
import { BASE_POLICY, CASBIN_MODEL } from '@app/unraid-api/auth/casbin';
import { CasbinModule } from '@app/unraid-api/auth/casbin/casbin.module';
import { CasbinService } from '@app/unraid-api/auth/casbin/casbin.service';
import { CookieService, SESSION_COOKIE_CONFIG } from '@app/unraid-api/auth/cookie.service';
import { UserCookieStrategy } from '@app/unraid-api/auth/cookie.strategy';
import { ServerHeaderStrategy } from '@app/unraid-api/auth/header.strategy';
import { getRequest } from '@app/utils';

@Module({
    imports: [
        PassportModule.register({
            defaultStrategy: [ServerHeaderStrategy.key, UserCookieStrategy.key],
        }),
        CasbinModule,
        AuthZModule.register({
            imports: [CasbinModule],
            enforcerProvider: {
                provide: AUTHZ_ENFORCER,
                useFactory: async (casbinService: CasbinService) => {
                    return casbinService.initializeEnforcer(CASBIN_MODEL, BASE_POLICY);
                },
                inject: [CasbinService],
            },
            userFromContext: (ctx: ExecutionContext) => {
                const logger = new Logger('AuthZModule');

                try {
                    const request = getRequest(ctx);
                    const roles = request?.user?.roles || [];

                    if (!Array.isArray(roles)) {
                        throw new UnauthorizedException('User roles must be an array');
                    }

                    return roles.join(',');
                } catch (error) {
                    logger.error('Failed to extract user context', error);
                    throw new UnauthorizedException('Failed to authenticate user');
                }
            },
        }),
    ],
    providers: [
        AuthService,
        ApiKeyService,
        ServerHeaderStrategy,
        UserCookieStrategy,
        CookieService,
        {
            provide: SESSION_COOKIE_CONFIG,
            useValue: CookieService.defaultOpts(),
        },
    ],
    exports: [
        AuthService,
        ApiKeyService,
        PassportModule,
        ServerHeaderStrategy,
        UserCookieStrategy,
        CookieService,
        AuthZModule,
    ],
})
export class AuthModule {}
