import { type UserAccount } from '@app/graphql/generated/api/types';
import { Injectable } from '@nestjs/common';
import { Logger } from '@nestjs/common';

import { ApiKeyService } from '../auth/api-key.service';

@Injectable()
export class UsersService {
    private logger = new Logger(UsersService.name);
    constructor(private apiKeyService: ApiKeyService) {}

    async findOneByKey(apiKey: string): Promise<UserAccount | null> {
        try {
            const key = await this.apiKeyService.findByKey(apiKey);

            if (!key) return null;

            return {
                id: key.id,
                description: key.description ?? `API Key ${key.name}`,
                name: key.name,
                roles: key.roles,
            };
        } catch (error) {
            this.logger.error(`Error finding user by key: ${error}`);
            return null;
        }
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
            roles: ['upc'],
        };
    }
}
