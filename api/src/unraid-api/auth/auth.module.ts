import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { PassportModule } from '@nestjs/passport';
import { ServerHeaderStrategy } from '@app/unraid-api/auth/header.strategy';
import { CookieService, SESSION_COOKIE_CONFIG } from './cookie.service';
import { UserCookieStrategy } from './cookie.strategy';
import { GraphqlAuthGuard } from '@app/unraid-api/auth/auth.guard';
import { UsersService } from '@app/unraid-api/auth/users.service';
import { AccessControlModule, ACGuard } from 'nest-access-control';
import { setupPermissions } from '@app/core/permissions';

@Module({
    imports: [PassportModule.register({}), AccessControlModule.forRoles(setupPermissions())],
    providers: [
        AuthService,
        ServerHeaderStrategy,
        UserCookieStrategy,
        CookieService,
        { provide: SESSION_COOKIE_CONFIG, useValue: CookieService.defaultOpts() },
        { provide: 'USERS_SERVICE', useClass: UsersService },
        { provide: 'AUTH_SERVICE', useClass: AuthService },
        { provide: 'COOKIE_SERVICE', useClass: CookieService },
        { provide: 'APP_GUARD', useClass: GraphqlAuthGuard },
        {
            provide: 'APP_GUARD',
            useClass: ACGuard,
        },
    ],
    exports: [PassportModule],
})
export class AuthModule {}
