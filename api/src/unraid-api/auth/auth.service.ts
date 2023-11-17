import { UsersService } from '@app/unraid-api/users/users.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) {}

    async validateUser(apiKey: string): Promise<any> {
        return await this.usersService.findOne(apiKey);
    }
}
