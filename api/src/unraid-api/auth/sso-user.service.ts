import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type { SsoUserService as ISsoUserService } from '@unraid/shared/services/sso.js';
import { GraphQLError } from 'graphql/error/GraphQLError.js';

import type { ApiConfig } from '@app/unraid-api/config/api-config.module.js';
import { UnraidFileModificationService } from '@app/unraid-api/unraid-file-modifier/unraid-file-modifier.service.js';

@Injectable()
export class SsoUserService implements ISsoUserService {
    private readonly logger = new Logger(SsoUserService.name);
    private ssoSubIdsConfigKey = 'api.ssoSubIds';

    constructor(
        private readonly configService: ConfigService,
        @Optional() private readonly fileModificationService?: UnraidFileModificationService
    ) {}

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

        // Handle file modification if available
        if (this.fileModificationService) {
            // If going from 0 to 1+ users, apply the SSO modification
            if (currentUserSet.size === 0 && newUserSet.size > 0) {
                try {
                    await this.fileModificationService.applyModificationById('sso');
                    this.logger.log('Applied SSO file modification after adding SSO users');
                } catch (error) {
                    this.logger.error('Failed to apply SSO file modification', error);
                }
            }
            // If going from 1+ to 0 users, rollback the SSO modification
            else if (currentUserSet.size > 0 && newUserSet.size === 0) {
                try {
                    await this.fileModificationService.rollbackModificationById('sso');
                    this.logger.log('Rolled back SSO file modification after removing all SSO users');
                } catch (error) {
                    this.logger.error('Failed to rollback SSO file modification', error);
                }
            }
        }

        // No restart required - file modifications are applied immediately
        return false;
    }
}
