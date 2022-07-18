/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { paths } from '@app/core/paths';
import { PermissionError } from '@app/core/errors/permission-error';
import { checkAuth } from '@app/core/utils/authentication/check-auth';

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
		file: file || paths.htpasswd,
	});

	if (!valid) {
		throw new PermissionError('Invalid auth!');
	}
};
