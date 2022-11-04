import { expect, test } from 'vitest';
import { sendFormToKeyServer } from '@app/core/utils/misc/send-form-to-keyserver';

test('when server is unreachable, rejects and throws error', async () => {
	await expect(sendFormToKeyServer('INVALID_URL', { myData: 'is_invalid' })).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid URL"');

	await expect(sendFormToKeyServer('http://thisisaninvalidwebsiteaddress12345', { myData: 'is_invalid' })).rejects.toThrowError();
}, 6_000); // We need to account for the 5s timeout that occurs when we use sendFormToKeyServer
