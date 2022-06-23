/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { ac } from '@app/core/permissions';

/**
 * Get permissions from an {@link https://onury.io/accesscontrol/?api=ac#AccessControl AccessControl} role.
 * @param role The {@link https://onury.io/accesscontrol/?api=ac#AccessControl AccessControl} role to be looked up.
 */
export const getPermissions = (role: string): Record<string, Record<string, string[]>> => {
	const grants: Record<string, Record<string, string[]>> = ac.getGrants();
	const { $extend, ...roles } = grants[role] ?? {};
	const inheritedRoles = Array.isArray($extend) ? $extend.map(role => getPermissions(role))[0] : {};
	return Object.assign({}, roles, inheritedRoles);
};
