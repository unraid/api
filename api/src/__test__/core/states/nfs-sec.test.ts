import { expect, test } from 'vitest';
import { NfsSec } from '@app/core/states/nfs-sec';

test('NfsSec is a singleton', () => {
	expect(new NfsSec()).toBe(new NfsSec());
});
