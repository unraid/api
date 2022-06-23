/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import htpasswd from 'htpasswd-js';
import { paths } from '@app/core/paths';

interface Options {
	username: string;
	password: string;
	file?: string;
}

/**
 * Check if the username and password match a htpasswd file.
 */
export const checkAuth = async (options: Options): Promise<any> => {
	const { username, password, file } = options;

	// `valid` will be true if and only if
	// username and password were correct.
	return htpasswd.authenticate({
		username,
		password,
		file: file ?? paths.htpasswd
	});
};
