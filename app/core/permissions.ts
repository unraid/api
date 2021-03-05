import fs from 'fs';
import path from 'path';
import { paths } from './paths';
import { coreLogger } from './log';
import { permissions as defaultPermissions } from './default-permissions';
import { AccessControl } from 'accesscontrol';

interface Permission {
	role?: string;
	resource: string;
	action: string;
	attributes: string;
}

type Permissions = Record<string, {
	extends?: string | string[];
	permissions?: Permission[];
}>;

const loadPermissionsFile = (filePath: string) => {
	// Create file if it's missing
	if (!fs.existsSync(filePath)) {
		const directoryPath = filePath.slice(0, filePath.lastIndexOf('/') + 1);
		fs.mkdir(directoryPath, { recursive: true }, () => {
			fs.writeFileSync(filePath, JSON.stringify(defaultPermissions, null, 2));
		});

		return defaultPermissions;
	}

	// Load newly created permissions file
	return JSON.parse(fs.readFileSync(filePath).toString('utf8')) as Partial<Permissions>;
};

const getPermissions = () => {
	try {
		const unraidDataDir = paths.get('unraid-data')!;
		const permissionsConfigPath = path.join(unraidDataDir, 'permissions.json');

		// Load permissions file
		return loadPermissionsFile(permissionsConfigPath);
	} catch {}

	// Fallback to built in permissions
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

coreLogger.silly('Loaded permissions', JSON.stringify(allPermissions));

export {
	ac
};
