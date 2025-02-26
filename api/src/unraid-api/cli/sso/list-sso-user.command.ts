import { Injectable } from '@nestjs/common';

import { CommandRunner, SubCommand } from 'nest-commander';

import { store } from '@app/store/index.js';
import { loadConfigFile } from '@app/store/modules/config.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

@Injectable()
@SubCommand({
    name: 'list-users',
    aliases: ['list', 'l'],
    description: 'List all users for SSO',
})
export class ListSSOUserCommand extends CommandRunner {
    constructor(private readonly logger: LogService) {
        super();
    }

    async run(_input: string[]): Promise<void> {
        await store.dispatch(loadConfigFile());
        this.logger.info(store.getState().config.remote.ssoSubIds.split(',').filter(Boolean).join('\n'));
    }
}
