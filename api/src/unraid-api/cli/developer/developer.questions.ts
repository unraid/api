import { Question, QuestionSet } from 'nest-commander';

@QuestionSet({ name: 'developer' })
export class DeveloperQuestions {
    static name = 'developer';

    @Question({
        message: `Are you sure you wish to enable developer mode?
Currently this allows enabling the GraphQL sandbox on SERVER_URL/graphql.
`,
        type: 'confirm',
        name: 'disclaimer',
    })
    parseDisclaimer(val: boolean) {
        return val;
    }

    @Question({
        message: 'Do you wish to enable the sandbox?',
        type: 'confirm',
        name: 'sandbox',
    })
    parseSandbox(val: boolean) {
        return val;
    }
}
