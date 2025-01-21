import { Question, QuestionSet } from 'nest-commander';





@QuestionSet({ name: 'add-user' })
export class AddSSOUserQuestionSet {
    static name = 'add-user';

    @Question({
        message: 'Are you sure you wish to add a user for SSO - this will enable single sign on in Unraid and has certain security implications? (y/n)',
        name: 'disclaimer',
        validate(input) {
            if (!input) {
                return 'Please provide a response';
            }
            if (!['y', 'n'].includes(input.toLowerCase())) {
                return 'Please provide a valid response';
            }
            if (input.toLowerCase() === 'n') {
                process.exit(1);
            }
            return true;
        },
    })
    parseDisclaimer(val: string) {
        return val;
    }

    @Question({
        message: 'What is the cognito username (NOT YOUR UNRAID USERNAME)? Find it in your Unraid Account at https://account.unraid.net',
        name: 'username',
        validate(input) {
            if (!input) {
                return 'Username is required';
            }
            if (!/^[a-zA-Z0-9-]+$/.test(input)) {
                return 'Username must be alphanumeric and can include dashes.';
            }
            return true;
        },
    })
    parseName(val: string) {
        return val;
    }
}