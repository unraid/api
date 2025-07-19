import { Injectable } from '@nestjs/common';

import { Command, CommandRunner, InquirerService } from 'nest-commander';

import { DeveloperQuestions } from '@app/unraid-api/cli/developer/developer.questions.js';
import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { UPDATE_SANDBOX_MUTATION } from '@app/unraid-api/cli/queries/developer.mutation.js';
import { StartCommand } from '@app/unraid-api/cli/start.command.js';
import { StopCommand } from '@app/unraid-api/cli/stop.command.js';

interface DeveloperOptions {
    disclaimer: boolean;
    sandbox: boolean;
}

@Injectable()
@Command({
    name: 'developer',
    description: 'Configure Developer Features for the API',
})
export class DeveloperCommand extends CommandRunner {
    constructor(
        private logger: LogService,
        private readonly inquirerService: InquirerService,
        private readonly startCommand: StartCommand,
        private readonly stopCommand: StopCommand,
        private readonly internalClient: CliInternalClientService
    ) {
        super();
    }
    async run(_args: string[], options?: DeveloperOptions): Promise<void> {
        options = await this.inquirerService.prompt(DeveloperQuestions.name, options);
        if (!options.disclaimer) {
            this.logger.warn('No changes made, disclaimer not accepted.');
            process.exit(1);
        }

        try {
            const client = await this.internalClient.getClient();

            await this.stopCommand.run([]);

            const result = await client.mutate({
                mutation: UPDATE_SANDBOX_MUTATION,
                variables: {
                    input: {
                        api: {
                            sandbox: options.sandbox,
                        },
                    },
                },
            });

            if (result.data?.updateSettings.restartRequired) {
                this.logger.info(
                    'Updated Developer Configuration - restart the API in 5 seconds to apply them...'
                );
                await new Promise((resolve) => setTimeout(resolve, 5000));
                await this.startCommand.run([], {});
            } else {
                this.logger.info('Developer Configuration updated successfully.');
            }
        } catch (error) {
            this.logger.error('Failed to update developer configuration:', error);
            process.exit(1);
        }
    }
}
