import { expect, test } from 'vitest';
import { SmbSec } from '../../../core/states/smb-sec';

test('SmbSec is a singleton', () => {
	expect(new SmbSec()).toBe(new SmbSec());
});
