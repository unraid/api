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
                        const enforcer = await newEnforcer(model, policy);
                        enforcer.enableLog(true);

                        // Handle combined action:possession format so we can use seperate enums in the policy
                        const originalEnforce = enforcer.enforce.bind(enforcer);
                        enforcer.enforce = async (...args: any[]) => {
                            if (args.length === 3) {
                                const [sub, obj, actPoss] = args;
                                const [action, possession] = actPoss.split(':');

                                const roles = sub.split(',');
                                for (const role of roles) {
                                    const allowed = await originalEnforce(
                                        role.trim(),
                                        obj,
                                        action.toUpperCase(),
                                        possession.toUpperCase()
                                    );
                                    if (allowed) {
                                        return true;
                                    }
                                }
                                return false;
                            }
                            return originalEnforce(...args);
                        };

                        return enforcer;
                    } catch (error: unknown) {
                        throw new Error(`Failed to create Casbin enforcer: ${error}`);
                    }
                },
            },
            userFromContext: (ctx) => {
                try {
                    const request =
                        ctx.getType() === 'http'
                            ? ctx.switchToHttp().getRequest()
                            : ctx.getType() === 'graphql'
                                ? ctx.getArgByIndex(2)?.req
                                : null;

                    if (!request) {
                        throw new Error(`Unsupported execution context type: ${ctx.getType()}`);
                    }

                    const roles = request?.user?.roles || '';
                    if (roles && !Array.isArray(roles)) {
                        throw new Error('User roles must be an array');
                    }

                    return roles?.join(',') || '';
                } catch (error) {
                    console.error('Failed to extract user context:', error);
                    return '';  // Return empty string as fallback for Casbin
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
