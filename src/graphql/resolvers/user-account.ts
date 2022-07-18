/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

export const UserAccount = {
	__resolveType(obj: Record<string, unknown>) {
		// Only a user has a password field, the current user aka "me" doesn't.
		return obj.password ? 'User' : 'Me';
	},
};
