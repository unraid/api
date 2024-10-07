import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersModule } from '@app/unraid-api/users/users.module';
import { PassportModule } from '@nestjs/passport';
import { ServerHeaderStrategy } from '@app/unraid-api/auth/header.strategy';
import { CookieService, SESSION_COOKIE_CONFIG } from './cookie.service';

@Module({
    imports: [UsersModule, PassportModule],
    providers: [
        AuthService,
        ServerHeaderStrategy,
        CookieService,
        { provide: SESSION_COOKIE_CONFIG, useValue: CookieService.defaultOpts() },
    ],
})
export class AuthModule {}
