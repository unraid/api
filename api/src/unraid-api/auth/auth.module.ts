import { AuthZModule, AUTHZ_ENFORCER } from 'nest-authz';
import { Module, forwardRef } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { newEnforcer, Model as CasbinModel, StringAdapter } from 'casbin';

import { ApiKeyService } from './api-key.service';
import { AuthService } from './auth.service';
import { CASBIN_MODEL, BASE_POLICY } from './casbin';
import { CookieService, SESSION_COOKIE_CONFIG } from './cookie.service';
import { UsersModule } from '../users/users.module';
import { ServerHeaderStrategy } from './header.strategy';
import { UserCookieStrategy } from './cookie.strategy';

@Module({
    imports: [
        forwardRef(() => UsersModule),
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

                    return await newEnforcer(model, policy);
                },
            },
            userFromContext: (ctx) => {
                const request = ctx.switchToHttp().getRequest();
                return (
                    request.user && {
                        username: request.user.username,
                        isAdmin: request.user.isAdmin,
                    }
                );
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
