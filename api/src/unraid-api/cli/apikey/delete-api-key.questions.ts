import { ChoicesFor, Question, QuestionSet } from 'nest-commander';

import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

export interface DeleteApiKeyAnswers {
    selectedKeys: string[];
}

@QuestionSet({ name: 'delete-api-key' })
export class DeleteApiKeyQuestionSet {
    constructor(
        private readonly apiKeyService: ApiKeyService,
        private readonly logger: LogService
    ) {}

    static name = 'delete-api-key';

    @Question({
        name: 'selectedKeys',
        type: 'checkbox',
        message: 'Select API keys to delete:',
    })
    parseSelectedKeys(keyIds: string[]): string[] {
        return keyIds;
    }

    @ChoicesFor({ name: 'selectedKeys' })
    async getKeys() {
        const keys = await this.apiKeyService.findAll();
        return keys.map((key) => ({
            name: `${key.name} (${key.description ?? ''}) [${key.id}]`,
            value: key.id,
        }));
    }
}
