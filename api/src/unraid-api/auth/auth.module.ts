import { AuthZModule, AUTHZ_ENFORCER } from 'nest-authz';
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { newEnforcer, Model as CasbinModel, StringAdapter } from 'casbin';

import { ApiKeyService } from './api-key.service';
import { AuthService } from './auth.service';
import { CASBIN_MODEL, BASE_POLICY } from './casbin';
import { CookieService, SESSION_COOKIE_CONFIG } from './cookie.service';
import { ServerHeaderStrategy } from './header.strategy';
import { UserCookieStrategy } from './cookie.strategy';
import { UsersModule } from '../users/users.module';

@Module({
    imports: [
        UsersModule,
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
                        return await newEnforcer(model, policy);
                    } catch (error: unknown) {
                        throw new Error(`Failed to create Casbin enforcer: ${error}`);
                    }
                },
            },
            userFromContext: (ctx) => {
                const request = ctx.switchToHttp().getRequest();

                return request.user
                    ? {
                          id: request.user.id,
                          roles: request.user.roles,
                      }
                    : '';
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
