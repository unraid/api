export const UserAccount = {
	__resolveType(obj: Record<string, unknown>) {
		// Only a user has a password field, the current user aka "me" doesn't.
		return obj.password ? 'User' : 'Me';
	},
};
