import { BYPASS_PERMISSION_CHECKS } from '@app/environment';
import { type UserAccount } from '@app/graphql/generated/api/types';
import { getters } from '@app/store/index';
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';

// This should be a real class/interface representing a user entity
export type User = any;

@Injectable()
export class UsersService {
    private logger = new Logger(UsersService.name);
    async apiKeyToUser(apiKey: string): Promise<UserAccount | null> {
        const config = getters.config();
        if (BYPASS_PERMISSION_CHECKS === true) {
            this.logger.warn(
                `BYPASSING_PERMISSION_CHECK`
            );
            return {
                id: "-1",
                description: 'BYPASS_PERMISSION_CHECK',
                name: 'BYPASS_PERMISSION_CHECK',
                roles: 'admin',
            };
        }
        if (apiKey === config.remote.apikey)
            return {
                id: "-1",
                description: 'My servers service account',
                name: 'my_servers',
                roles: 'my_servers',
            };
        if (apiKey === config.upc.apikey)
            return {
                id: "-1",
                description: 'UPC service account',
                name: 'upc',
                roles: 'upc'
            };
        if (apiKey === config.notifier.apikey)
            return {
                id: "-1",
                description: 'Notifier service account',
                name: 'notifier',
                roles: 'notifier',
            };

        return null;
    }

    async findOne(apiKey: string): Promise<User | undefined> {
        return this.apiKeyToUser(apiKey);
    }
}
