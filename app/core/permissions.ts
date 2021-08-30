import { coreLogger } from './log';
import { permissions as defaultPermissions } from './default-permissions';
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
for (const [roleName, role] of Object.entries(getPermissions())) {
	if (role.extends) {
		ac.extendRole(roleName, role.extends);
	}
}

coreLogger.silly('Loaded permissions', JSON.stringify(allPermissions));

export {
	ac
};
