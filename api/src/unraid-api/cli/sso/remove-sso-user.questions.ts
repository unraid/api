import { ChoicesFor, Question, QuestionSet } from 'nest-commander';

import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { SSO_USERS_QUERY } from '@app/unraid-api/cli/queries/sso-users.query.js';

@QuestionSet({ name: 'remove-user' })
export class RemoveSSOUserQuestionSet {
    constructor(
        private readonly logger: LogService,
        private readonly internalClient: CliInternalClientService
    ) {}
    static name = 'remove-user';

    @Question({
        message: `Please select from the following list of users to remove from SSO, or enter all to remove all users from SSO.\n`,
        name: 'username',
        type: 'list',
    })
    parseName(val: string) {
        return val;
    }

    @ChoicesFor({ name: 'username' })
    async choicesForUsername() {
        try {
            const client = await this.internalClient.getClient();

            const result = await client.query({
                query: SSO_USERS_QUERY,
            });

            const users = result.data?.settings?.api?.ssoSubIds || [];

            if (users.length === 0) {
                this.logger.error('No SSO Users Found');
                process.exit(0);
            }
            users.push('all');
            return users;
        } catch (error) {
            this.logger.error('Failed to fetch SSO users:', error);
            process.exit(1);
        }
    }
}
