import { ChoicesFor, Question, QuestionSet, WhenFor } from 'nest-commander';

import type { Permission } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { Role } from '@app/unraid-api/plugins/connect/api/graphql/generated/api/types.js';
import { ApiKeyService } from '@app/unraid-api/auth/api-key.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

@QuestionSet({ name: 'add-api-key' })
export class AddApiKeyQuestionSet {
    constructor(
        private readonly apiKeyService: ApiKeyService,
        private readonly logger: LogService
    ) {}

    static name = 'add-api-key';

    @Question({
        name: 'name',
        message: 'What is the name of the API key?',
    })
    parseName(val: string) {
        return val;
    }

    @Question({
        message: 'Enter a description for your key, this will help you identify the key later',
        name: 'description',
    })
    parseDescription(val: string) {
        return val;
    }

    @Question({
        name: 'roles',
        type: 'checkbox',
        message: 'Choose the roles for the API key',
    })
    parseRoles(val: string[]): Role[] {
        return this.apiKeyService.convertRolesStringArrayToRoles(val);
    }

    @ChoicesFor({ name: 'roles' })
    async getRoles() {
        return Object.values(Role);
    }

    @Question({
        name: 'permissions',
        type: 'checkbox',
        message: 'Choose the permissions for the API key',
    })
    parsePermissions(val: string[]): Permission[] {
        return this.apiKeyService.convertPermissionsStringArrayToPermissions(val);
    }

    @ChoicesFor({ name: 'permissions' })
    async getPermissions() {
        return this.apiKeyService
            .getAllValidPermissions()
            .map((permission) => permission.actions.map((action) => `${permission.resource}:${action}`))
            .flat();
    }

    @Question({
        name: 'overwrite',
        type: 'confirm',
        message: 'An API key with this name already exists, do you want to overwrite it?',
    })
    parseOverwrite(val: string) {
        return val;
    }

    @WhenFor({ name: 'overwrite' })
    shouldAskOverwrite(options: { name: string }): boolean {
        return Boolean(this.apiKeyService.findByKey(options.name));
    }
}
