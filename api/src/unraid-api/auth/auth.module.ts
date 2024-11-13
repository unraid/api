import { Module } from '@nestjs/common';
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
                        return await newEnforcer(model, policy);
                    } catch (error: unknown) {
                        throw new Error(`Failed to create Casbin enforcer: ${error}`);
                    }
                },
            },
            userFromContext: (ctx) => {
                const request =
                    ctx.getType() === 'http'
                        ? ctx.switchToHttp().getRequest()
                        : ctx.getArgByIndex(2).req;

                return request?.user?.roles?.join(',') || '';
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
