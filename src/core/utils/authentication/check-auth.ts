/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getters } from '@app/store';
import htpasswd from 'htpasswd-js';

interface Options {
	username: string;
	password: string;
	file?: string;
}

/**
 * Check if the username and password match a htpasswd file.
 */
export const checkAuth = async (options: Options): Promise<unknown> => {
	const { username, password, file } = options;

	// `valid` will be true if and only if
	// username and password were correct.
	return htpasswd.authenticate({
		username,
		password,
		file: file ?? getters.paths().htpasswd,
	});
};
