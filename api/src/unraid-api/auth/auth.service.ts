import { type UserAccount } from '@app/graphql/generated/api/types';
import { UsersService } from '@app/unraid-api/auth/users.service';
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { CookieService } from './cookie.service';

@Injectable()
export class AuthService {
    constructor(
        @Inject('USERS_SERVICE') private usersService: UsersService,
        @Inject('COOKIE_SERVICE') private cookieService: CookieService
    ) {}

    async validateUser(apiKey: string): Promise<UserAccount> {
        const user = this.usersService.findOne(apiKey);
        if (user) {
            return user;
        }
        console.log('Invalid User');
        throw new UnauthorizedException('Invalid API key');
    }

    async validateCookies(cookies: object): Promise<UserAccount> {
        if (await this.cookieService.hasValidAuthCookie(cookies)) {
            return this.usersService.getSessionUser();
        }
        console.log('No user session found');
        throw new UnauthorizedException('No user session found');
    }
}
