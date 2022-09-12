import { checkMothershipRestarting } from '@app/graphql/resolvers/query/cloud/check-mothership-restarting';
import { expect, test } from 'vitest';

test('Defaults', async () => {
	expect(() => {
		checkMothershipRestarting();
	}).to.not.throw();
});

test('Restarting', async () => {
	const { relayStore } = await import('@app/mothership/store');
	relayStore.code = 12;
	relayStore.reason = 'SERVICE_RESTART';
	relayStore.relay = undefined;
	relayStore.timeout = Date.now() + 60_000;
	expect(() => {
		checkMothershipRestarting();
	}).to.toThrowErrorMatchingInlineSnapshot('"Mothership is restarting"');
});
