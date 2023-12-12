import { type UserAccount } from '@app/graphql/generated/api/types';
import { UsersService } from '@app/unraid-api/users/users.service';
import { Injectable, UnauthorizedException } from '@nestjs/common';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) {}

    async validateUser(apiKey: string): Promise<UserAccount> {

        const user = this.usersService.findOne(apiKey);
        if (user) {
            return user;
        }
        throw new UnauthorizedException('Invalid API key');
    }
}
