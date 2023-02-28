import { checkMothershipAuthentication } from "@app/graphql/resolvers/query/cloud/check-mothership-authentication";
import { expect, test } from "vitest";
import packageJson from '@app/../package.json'

test('It fails to authenticate with mothership with no credentials', async () => {
    await expect(checkMothershipAuthentication('BAD', 'BAD')).rejects.toThrowErrorMatchingInlineSnapshot('"Failed to connect to https://mothership.unraid.net/ws with a \\"426\\" HTTP error."');
    expect(packageJson.version).not.toBeNull();
    await expect(checkMothershipAuthentication(packageJson.version, 'BAD_API_KEY')).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid credentials"');
})