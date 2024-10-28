import { BYPASS_PERMISSION_CHECKS } from '@app/environment';
import { type UserAccount } from '@app/graphql/generated/api/types';
import { getters } from '@app/store/index';
import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { ApiKeyService } from '../auth/api-key.service';

@Injectable()
export class UsersService {
    private logger = new Logger(UsersService.name);
    constructor(
        @Inject(forwardRef(() => ApiKeyService))
        private apiKeyService: ApiKeyService
    ) {}

    apiKeyToUser(apiKey: string): UserAccount | null {
        const config = getters.config();
        if (BYPASS_PERMISSION_CHECKS === true) {
            this.logger.warn(`BYPASSING_PERMISSION_CHECK`);
            return {
                id: '-1',
                description: 'BYPASS_PERMISSION_CHECK',
                name: 'BYPASS_PERMISSION_CHECK',
                roles: 'admin',
            };
        }
        if (apiKey === config.remote.apikey)
            return {
                id: '-1',
                description: 'My servers service account',
                name: 'my_servers',
                roles: 'my_servers',
            };
        if (apiKey === config.upc.apikey)
            return {
                id: '-1',
                description: 'UPC service account',
                name: 'upc',
                roles: 'upc',
            };
        if (apiKey === config.notifier.apikey)
            return {
                id: '-1',
                description: 'Notifier service account',
                name: 'notifier',
                roles: 'notifier',
            };

        return null;
    }

    findOne(apiKey: string): UserAccount | null {
        return this.apiKeyToUser(apiKey);
    }

    async findOneByKey(apiKey: string): Promise<UserAccount | null> {
        const key = await this.apiKeyService.findByKey(apiKey);
        if (!key) return null;

        return {
            id: key.id,
            description: key.description ?? `API Key ${key.name}`,
            name: key.name,
            roles: key.roles.join(','),
        };
    }

    /**
     * Returns a user object representing a session.
     * Note: Does NOT perform validation.
     *
     * @returns a service account that represents the user session (i.e. a webgui user).
     */
    getSessionUser(): UserAccount {
        return {
            id: '-1',
            description: 'UPC service account',
            name: 'upc',
            roles: 'upc',
        };
    }
}
