import { logger } from '@app/core/log';
import { permissions as defaultPermissions } from '@app/core/default-permissions';
import { AccessControl } from 'accesscontrol';

// Use built in permissions
const getPermissions = () => defaultPermissions;

// Build permissions array
const roles = getPermissions();
const permissions = Object.entries(roles).flatMap(([roleName, role]) => [
	...(role?.permissions ?? []).map(permission => ({
		...permission,
		role: roleName,
	})),
]);

// Grant permissions
const ac = new AccessControl(permissions);

// Extend roles
Object.entries(getPermissions()).forEach(([roleName, role]) => {
	if (role.extends) {
		ac.extendRole(roleName, role.extends);
	}
});

logger.addContext('permissions', permissions);
logger.trace('Loaded permissions');
logger.removeContext('permissions');

export {
	ac,
};
