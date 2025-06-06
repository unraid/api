import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { SsoUserService as ISsoUserService } from '@unraid/shared/services/sso.js';
import { GraphQLError } from 'graphql/error/GraphQLError.js';

import type { ApiConfig } from '@app/unraid-api/config/api-config.module.js';

@Injectable()
export class SsoUserService implements ISsoUserService {
    private readonly logger = new Logger(SsoUserService.name);
    private ssoSubIdsConfigKey = 'api.ssoSubIds';

    constructor(private readonly configService: ConfigService) {}

    /**
     * Get the current list of SSO user IDs
     * @returns Array of SSO user IDs
     */
    async getSsoUsers(): Promise<string[]> {
        const ssoSubIds = this.configService.getOrThrow<ApiConfig['ssoSubIds']>(this.ssoSubIdsConfigKey);
        return ssoSubIds;
    }

    /**
     * Set the complete list of SSO user IDs
     * @param userIds - The list of SSO user IDs to set
     * @returns true if a restart is required, false otherwise
     */
    async setSsoUsers(userIds: string[]): Promise<boolean> {
        const currentUsers = await this.getSsoUsers();
        const currentUserSet = new Set(currentUsers);
        const newUserSet = new Set(userIds);

        // If there's no change, no need to update
        if (newUserSet.symmetricDifference(currentUserSet).size === 0) {
            return false;
        }

        // Validate user IDs
        const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        const invalidUserIds = userIds.filter((id) => !uuidRegex.test(id));
        if (invalidUserIds.length > 0) {
            throw new GraphQLError(`Invalid SSO user ID's: ${invalidUserIds.join(', ')}`);
        }

        // Update the config
        this.configService.set(this.ssoSubIdsConfigKey, userIds);

        // Request a restart if there were no SSO users before
        return currentUserSet.size === 0;
    }

    /**
     * Add a single SSO user ID
     * @param userId - The SSO user ID to add
     * @returns true if a restart is required, false otherwise
     */
    async addSsoUser(userId: string): Promise<boolean> {
        const currentUsers = await this.getSsoUsers();

        // If user already exists, no need to update
        if (currentUsers.includes(userId)) {
            return false;
        }

        // Validate user ID
        const uuidRegex =
            /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
        if (!uuidRegex.test(userId)) {
            throw new GraphQLError(`Invalid SSO user ID: ${userId}`);
        }

        // Add the new user
        const newUsers = [...currentUsers, userId];
        this.configService.set(this.ssoSubIdsConfigKey, newUsers);

        // Request a restart if there were no SSO users before
        return currentUsers.length === 0;
    }

    /**
     * Remove a single SSO user ID
     * @param userId - The SSO user ID to remove
     * @returns true if a restart is required, false otherwise
     */
    async removeSsoUser(userId: string): Promise<boolean> {
        const currentUsers = await this.getSsoUsers();

        // If user doesn't exist, no need to update
        if (!currentUsers.includes(userId)) {
            return false;
        }

        // Remove the user
        const newUsers = currentUsers.filter((id) => id !== userId);
        this.configService.set(this.ssoSubIdsConfigKey, newUsers);

        // Request a restart if this was the last SSO user
        return currentUsers.length === 1;
    }

    /**
     * Remove all SSO users
     * @returns true if a restart is required, false otherwise
     */
    async removeAllSsoUsers(): Promise<boolean> {
        const currentUsers = await this.getSsoUsers();

        // If no users exist, no need to update
        if (currentUsers.length === 0) {
            return false;
        }

        // Remove all users
        this.configService.set(this.ssoSubIdsConfigKey, []);

        // Request a restart if there were any SSO users
        return true;
    }
}
