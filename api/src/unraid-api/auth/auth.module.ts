import { ExecutionContext, Logger, Module, UnauthorizedException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { PassportModule } from '@nestjs/passport';

import { Model as CasbinModel, newEnforcer, StringAdapter } from 'casbin';
import { AUTHZ_ENFORCER, AuthZModule } from 'nest-authz';

import { ApiKeyService } from './api-key.service';
import { AuthService } from './auth.service';
import { BASE_POLICY, CASBIN_MODEL } from './casbin';
import { CookieService, SESSION_COOKIE_CONFIG } from './cookie.service';
import { UserCookieStrategy } from './cookie.strategy';
import { ServerHeaderStrategy } from './header.strategy';

@Module({
    imports: [
        PassportModule.register({
            defaultStrategy: [ServerHeaderStrategy.key, UserCookieStrategy.key],
        }),
        AuthZModule.register({
            enforcerProvider: {
                provide: AUTHZ_ENFORCER,
                useFactory: async () => {
                    const model = new CasbinModel();
                    const policy = new StringAdapter(BASE_POLICY);
                    model.loadModelFromText(CASBIN_MODEL);

                    try {
                        const enforcer = await newEnforcer(model, policy);
                        enforcer.enableLog(true);

                        return enforcer;
                    } catch (error: unknown) {
                        throw new Error(`Failed to create Casbin enforcer: ${error}`);
                    }
                },
            },
            userFromContext: (ctx: ExecutionContext) => {
                const logger = new Logger('AuthZModule');

                try {
                    const contextType = ctx.getType<'http' | 'graphql' | 'rpc'>();
                    const request =
                        contextType === 'http'
                            ? ctx.switchToHttp().getRequest()
                            : contextType === 'graphql'
                              ? GqlExecutionContext.create(ctx).getContext().req
                              : null;

                    if (!request) {
                        throw new UnauthorizedException(
                            `Unsupported execution context type: ${contextType}`
                        );
                    }

                    const roles = request?.user?.roles || [];

                    if (!Array.isArray(roles)) {
                        throw new UnauthorizedException('User roles must be an array');
                    }

                    return roles.map((role) => role.toLowerCase()).join(',');
                } catch (error) {
                    logger.error('Failed to extract user context', error);

                    return '';
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
    ],
})
export class AuthModule {}
