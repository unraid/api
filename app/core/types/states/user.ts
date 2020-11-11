/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

/**
 *
 * User
 * @interface User
 */
export interface User {
	/** User's ID */
	id: string;
	/** Display name */
	name: string;
	description: string;
	/** If password is set. */
	password: boolean;
	/** The main {@link Permissions~Role | role} linked to this account. */
	role: string;
}
