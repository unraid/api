export type User = {
	/** User's ID */
	id: string;
	/** Display name */
	name: string;
	description: string;
	/** If password is set. */
	password: boolean;
	/** The main {@link Permissions~Role | role} linked to this account. */
	role: string;
};

export type Users = User[];
