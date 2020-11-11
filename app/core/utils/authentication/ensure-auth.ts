/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { paths } from '../../paths';
import { PermissionError } from '../../errors';
import { checkAuth } from '..';

interface Options {
	username: string;
	password: string;
	file: string;
}

/**
 * Check if the username and password match a htpasswd file
 */
export const ensureAuth = async(options: Options) => {
	const { username, password, file } = options;

	// `valid` will be true if and only if
	// username and password were correct.
	const valid = await checkAuth({
		username,
		password,
		file: file || paths.get('htpasswd')!
	});

	if (!valid) {
		throw new PermissionError('Invalid auth!');
	}
};
