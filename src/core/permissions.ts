import { logger } from '@app/core/log';
import { permissions as defaultPermissions } from '@app/core/default-permissions';
import { AccessControl } from 'accesscontrol';

const getPermissions = () => {
	// Use built in permissions
	return defaultPermissions;
};

// Build permissions array
const roles = getPermissions();
const permissions = Object.entries(roles).flatMap(([roleName, role]) => [
	...(role?.permissions ?? []).map(permission => ({
		...permission,
		role: roleName
	}))
]);

const extraPermissions = [
	// @NOTE: Uncomment this to enable creation of api keys.
	//        See the README.md for more information.
	// @WARNING: This is currently unsupported, please be careful.
	// { role: 'admin', resource: 'apikey', action: 'create:any', attributes: '*' }
];

const allPermissions = [
	...permissions,
	...extraPermissions
];

// Grant permissions
const ac = new AccessControl(allPermissions);

// Extend roles
Object.entries(getPermissions()).forEach(([roleName, role]) => {
	if (role.extends) {
		ac.extendRole(roleName, role.extends);
	}
});

logger.addContext('permissions', allPermissions);
logger.trace('Loaded permissions');
logger.removeContext('permissions');

export {
	ac
};
