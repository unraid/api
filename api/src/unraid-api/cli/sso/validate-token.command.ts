import type { JWTPayload } from 'jose';
import { createLocalJWKSet, createRemoteJWKSet, jwtVerify } from 'jose';
import { CommandRunner, SubCommand } from 'nest-commander';

import { JWKS_LOCAL_PAYLOAD, JWKS_REMOTE_LINK } from '@app/consts.js';
import { CliInternalClientService } from '@app/unraid-api/cli/internal-client.service.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';
import { SSO_USERS_QUERY } from '@app/unraid-api/cli/queries/sso-users.query.js';

@SubCommand({
    name: 'validate-token',
    aliases: ['validate', 'v'],
    description: 'Returns JSON: { error: string | null, valid: boolean }',
    arguments: '<token>',
})
export class ValidateTokenCommand extends CommandRunner {
    JWKSOffline: ReturnType<typeof createLocalJWKSet>;
    JWKSOnline: ReturnType<typeof createRemoteJWKSet>;
    constructor(
        private readonly logger: LogService,
        private readonly internalClient: CliInternalClientService
    ) {
        super();
        this.JWKSOffline = createLocalJWKSet(JWKS_LOCAL_PAYLOAD);
        this.JWKSOnline = createRemoteJWKSet(new URL(JWKS_REMOTE_LINK));
    }

    private createErrorAndExit = (errorMessage: string) => {
        this.logger.error(
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

        if (!/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/.test(token)) {
            this.createErrorAndExit('Token format is invalid');
        }

        let caughtError: null | unknown = null;
        let tokenPayload: null | JWTPayload = null;
        try {
            // this.logger.debug('Attempting to validate token with local key');
            tokenPayload = (await jwtVerify(token, this.JWKSOffline)).payload;
        } catch (error: unknown) {
            try {
                // this.logger.debug('Local validation failed for key, trying remote validation');
                tokenPayload = (await jwtVerify(token, this.JWKSOnline)).payload;
            } catch (error: unknown) {
                caughtError = error;
            }
        }

        if (caughtError) {
            if (caughtError instanceof Error) {
                this.createErrorAndExit(`Caught error validating jwt token: ${caughtError.message}`);
            } else {
                this.createErrorAndExit('Caught unknown error validating jwt token');
            }
        }

        if (tokenPayload === null) {
            this.createErrorAndExit('No data in JWT to use for user validation');
        }

        const username = tokenPayload?.sub;

        if (!username) {
            return this.createErrorAndExit('No ID found in token');
        }
        const client = await this.internalClient.getClient();

        let result;
        try {
            result = await client.query({
                query: SSO_USERS_QUERY,
            });
        } catch (error) {
            this.createErrorAndExit('Failed to query SSO users');
        }

        if (result.errors && result.errors.length > 0) {
            this.createErrorAndExit('Failed to retrieve SSO configuration');
        }

        const ssoUsers = result.data?.settings?.api?.ssoSubIds || [];

        if (ssoUsers.length === 0) {
            this.createErrorAndExit(
                'No local user token set to compare to - please set any valid SSO IDs you would like to sign in with'
            );
        }
        if (ssoUsers.includes(username)) {
            this.logger.info(JSON.stringify({ error: null, valid: true, username }));
            process.exit(0);
        } else {
            this.createErrorAndExit('Username on token does not match');
        }
    }
}
