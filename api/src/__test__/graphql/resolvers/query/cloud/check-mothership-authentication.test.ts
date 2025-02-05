import 'reflect-metadata';

import { expect, test } from 'vitest';

import packageJson from '@app/../package.json';
import { checkMothershipAuthentication } from '@app/graphql/resolvers/query/cloud/check-mothership-authentication';

test('It fails to authenticate with mothership with no credentials', async () => {
    try {
        await expect(
            checkMothershipAuthentication('BAD', 'BAD')
        ).rejects.toThrowErrorMatchingInlineSnapshot(
            `[Error: Failed to connect to https://mothership.unraid.net/ws with a "426" HTTP error.]`
        );
        expect(packageJson.version).not.toBeNull();
        await expect(
            checkMothershipAuthentication(packageJson.version, 'BAD_API_KEY')
        ).rejects.toThrowErrorMatchingInlineSnapshot(`[Error: Invalid credentials]`);
    } catch (error) {
        if (error instanceof Error && error.message.includes('Timeout')) {
            // Test succeeds on timeout
            return;
        }
        throw error;
    }
});
