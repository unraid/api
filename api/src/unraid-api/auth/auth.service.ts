import { type UserAccount } from '@app/graphql/generated/api/types';
import { UsersService } from '@app/unraid-api/users/users.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CookieService } from './cookie.service';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService, private cookieService: CookieService) {}

    async validateUser(apiKey: string): Promise<UserAccount> {
        const user = this.usersService.findOne(apiKey);
        if (user) {
            return user;
        }
        throw new UnauthorizedException('Invalid API key');
    }

    async validateCookies(cookies: object): Promise<UserAccount> {
        if (await this.cookieService.hasValidAuthCookie(cookies)) {
            return this.usersService.getSessionUser();
        }
        throw new UnauthorizedException('No user session found');
    }
}
