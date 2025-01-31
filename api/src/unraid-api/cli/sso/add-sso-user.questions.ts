import { Question, QuestionSet } from 'nest-commander';
import { v4 as uuidv4 } from 'uuid';

@QuestionSet({ name: 'add-user' })
export class AddSSOUserQuestionSet {
    static name = 'add-user';

    @Question({
        message: `Enabling Single Sign-On (SSO) will simplify authentication by centralizing access to your Unraid server. However, this comes with certain security considerations: if your SSO account is compromised, unauthorized access to your server could occur.
       
Please note: your existing username and password will continue to work alongside SSO. We recommend using 2FA on your Unraid.net account or a single sign-on provider to enhance security.

Are you sure you want to proceed with adding a user for SSO? (y/n)
`,
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
        message:
            'What is your Unique Unraid Account ID? Find it in your Unraid Account at https://account.unraid.net/settings\n',
        name: 'username',
        validate(input) {
            if (!input) {
                return 'Username is required';
            }
            const randomUUID = uuidv4();

            if (
                !/^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(
                    input
                )
            ) {
                return `Username must be in the format of a UUID (e.g., ${randomUUID}).`;
            }
            return true;
        },
    })
    parseName(val: string) {
        return val;
    }
}
