import { ChoicesFor, Question, QuestionSet } from 'nest-commander';

import { store } from '@app/store/index.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

@QuestionSet({ name: 'remove-user' })
export class RemoveSSOUserQuestionSet {
    constructor(private readonly logger: LogService) {}
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
        const users = store
            .getState()
            .config.remote.ssoSubIds.split(',')
            .filter((user) => user !== '');
        if (users.length === 0) {
            this.logger.error('No SSO Users Found');
            process.exit(0);
        }
        users.push('all');
        return users;
    }
}
