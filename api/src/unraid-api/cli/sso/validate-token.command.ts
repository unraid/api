import { Inject } from '@nestjs/common';

import type { CanonicalInternalClientService } from '@unraid/shared';
import { CANONICAL_INTERNAL_CLIENT_TOKEN } from '@unraid/shared';
import { CommandRunner, SubCommand } from 'nest-commander';

import { LogService } from '@app/unraid-api/cli/log.service.js';
import { VALIDATE_OIDC_SESSION_QUERY } from '@app/unraid-api/cli/queries/validate-oidc-session.query.js';

@SubCommand({
    name: 'validate-token',
    aliases: ['validate', 'v'],
    description: 'Returns JSON: { error: string | null, valid: boolean }',
    arguments: '<token>',
})
export class ValidateTokenCommand extends CommandRunner {
    constructor(
        private readonly logger: LogService,
        @Inject(CANONICAL_INTERNAL_CLIENT_TOKEN)
        private readonly internalClient: CanonicalInternalClientService
    ) {
        super();
    }

    private createErrorAndExit = (errorMessage: string) => {
        this.logger.always(
            JSON.stringify({
                error: errorMessage,
                valid: false,
            })
        );
        process.exit(1);
    };

    async run(passedParams: string[]): Promise<void> {
        if (passedParams.length !== 1) {
            this.createErrorAndExit('Please pass token argument only');
        }

        const token = passedParams[0];

        if (typeof token !== 'string' || token.trim() === '') {
            this.createErrorAndExit('Invalid token provided');
        }

        // Always validate as OIDC token
        await this.validateOidcToken(token);
    }

    private async validateOidcToken(token: string): Promise<void> {
        try {
            const client = await this.internalClient.getClient({ enableSubscriptions: false });
            const { data, errors } = await client.query({
                query: VALIDATE_OIDC_SESSION_QUERY,
                variables: { token },
            });

            if (errors?.length) {
                const errorMessages = errors.map((e) => e.message).join(', ');
                this.createErrorAndExit(`GraphQL errors: ${errorMessages}`);
            }

            const validation = data?.validateOidcSession;

            if (validation?.valid) {
                this.logger.always(
                    JSON.stringify({
                        error: null,
                        valid: true,
                        username: validation.username || 'root',
                    })
                );
                process.exit(0);
            } else {
                this.createErrorAndExit('Invalid OIDC session token');
            }
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            this.createErrorAndExit(`Failed to validate OIDC session: ${errorMessage}`);
        }
    }
}
