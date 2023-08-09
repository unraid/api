import { PermissionError } from '@app/core/errors/permission-error';
import { checkAuth } from '@app/core/utils/authentication/check-auth';
import { getters } from '@app/store';

interface Options {
	username: string;
	password: string;
	file: string;
}

/**
 * Check if the username and password match a htpasswd file
 */
export const ensureAuth = async (options: Options) => {
	const { username, password, file } = options;

	// `valid` will be true if and only if
	// username and password were correct.
	const valid = await checkAuth({
		username,
		password,
		file: file || getters.paths().htpasswd,
	});

	if (!valid) {
		throw new PermissionError('Invalid auth!');
	}
};
