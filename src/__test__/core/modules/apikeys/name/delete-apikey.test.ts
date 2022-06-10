import { expect, test } from 'vitest';
import { deleteApikey } from '../../../../../core/modules/apikeys/name/delete-apikey';

test.fails('Deletes an API key from the API manager', async () => {
	await expect(deleteApikey({
		user: {
			id: '1',
			name: 'root',
			password: true,
			role: 'root',
			description: 'root user'
		},
		data: {
			password: 'secret-password'
		},
		params: {
			username: 'root'
		}
	})).not.rejects.toThrow();
});
