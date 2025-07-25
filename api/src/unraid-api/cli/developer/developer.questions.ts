import { Question, QuestionSet } from 'nest-commander';

@QuestionSet({ name: 'developer' })
export class DeveloperQuestions {
    static name = 'developer';

    @Question({
        message: 'Which developer tool would you like to configure?',
        type: 'list',
        name: 'tool',
        choices: [
            { name: 'GraphQL Sandbox', value: 'sandbox' },
            { name: 'Modal Testing Tool', value: 'modal-test' },
        ],
    })
    parseTool(val: string) {
        return val;
    }

    @Question({
        message: 'Enable GraphQL sandbox mode?',
        type: 'confirm',
        name: 'sandboxEnabled',
        when: (answers) => answers.tool === 'sandbox',
    })
    parseSandboxEnabled(val: boolean) {
        return val;
    }

    @Question({
        message: 'What would you like to do with the modal testing tool?',
        type: 'list',
        name: 'modalAction',
        choices: [
            { name: 'Enable', value: 'enable' },
            { name: 'Disable', value: 'disable' },
            { name: 'Show Status', value: 'status' },
        ],
        when: (answers) => answers.tool === 'modal-test',
    })
    parseModalAction(val: string) {
        return val;
    }
}
