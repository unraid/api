import { ChoicesFor, Question, QuestionSet, } from 'nest-commander';

import { store } from '@app/store/index';
import { loadConfigFile } from '@app/store/modules/config';


@QuestionSet({ name: 'remove-user' })
export class RemoveSSOUserQuestionSet {
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
        await store.dispatch(loadConfigFile());
        const users = store.getState().config.remote.ssoSubIds.split(',').filter((user) => user !== '');

        users.push('all');
        return users;
    }
}
