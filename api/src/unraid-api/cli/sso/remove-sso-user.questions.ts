import { ChoicesFor, Question, QuestionSet } from 'nest-commander';

import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { SSO_USERS_QUERY } from '@app/unraid-api/cli/queries/sso-users.query.js';

export class NoSSOUsersFoundError extends Error {
    constructor() {
        super('No SSO Users Found');
        this.name = 'NoSSOUsersFoundError';
    }
}

@QuestionSet({ name: 'remove-user' })
export class RemoveSSOUserQuestionSet {
    constructor(private readonly internalClient: CliInternalClientService) {}
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
        const client = await this.internalClient.getClient();

        const result = await client.query({
            query: SSO_USERS_QUERY,
        });

        const users = result.data?.settings?.api?.ssoSubIds || [];

        if (users.length === 0) {
            throw new NoSSOUsersFoundError();
        }

        users.push('all');
        return users;
    }
}
