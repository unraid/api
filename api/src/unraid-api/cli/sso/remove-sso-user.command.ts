import { Injectable } from '@nestjs/common';

import { CommandRunner, InquirerService, Option, OptionChoiceFor, SubCommand } from 'nest-commander';

import { store } from '@app/store/index';
import { loadConfigFile, removeSsoUser } from '@app/store/modules/config';
import { writeConfigSync } from '@app/store/sync/config-disk-sync';
import { LogService } from '@app/unraid-api/cli/log.service';
import { RemoveSSOUserQuestionSet } from '@app/unraid-api/cli/sso/remove-sso-user.questions';

interface RemoveSSOUserCommandOptions {
    username: string;
}

@Injectable()
@SubCommand({
    name: 'remove-user',
    aliases: ['remove', 'r'],
    description: 'Remove a user (or all users) from SSO',
})
export class RemoveSSOUserCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        private readonly inquirerService: InquirerService
    ) {
        super();
    }
    public async run(_input: string[], options: RemoveSSOUserCommandOptions): Promise<void> {
        await store.dispatch(loadConfigFile());
        options = await this.inquirerService.prompt(RemoveSSOUserQuestionSet.name, options);
        store.dispatch(removeSsoUser(options.username === 'all' ? null : options.username));
        if (options.username === 'all') {
            this.logger.info('All users removed from SSO');
        } else {
            this.logger.info('User removed: ' + options.username);
        }
        writeConfigSync('flash');
    }
}
