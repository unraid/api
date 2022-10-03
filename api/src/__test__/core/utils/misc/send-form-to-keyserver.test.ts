import { expect, test } from 'vitest';

import { sendFormToKeyServer } from '@app/core/utils/misc/send-form-to-keyserver';

test('when server is unreachable, is handled', async () => {
	await expect(sendFormToKeyServer('INVLALID_URL', { myData: 'is_invalid' })).rejects.toThrowErrorMatchingInlineSnapshot('"Invalid URL"');

	await expect(sendFormToKeyServer('http://thisisaninvalidwebsiteaddress12345', { myData: 'is_invalid' })).rejects.toThrowErrorMatchingInlineSnapshot('"getaddrinfo ENOTFOUND thisisaninvalidwebsiteaddress12345"');
});
