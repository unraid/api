export const admin = {
	extends: 'user',
	permissions: [
		// @NOTE: Uncomment the first line to enable creation of api keys.
		//        See the README.md for more information.
		// @WARNING: This is currently unsupported, please be careful.
		// { resource: 'apikey', action: 'create:any', attributes: '*' },
		{ resource: 'apikey', action: 'read:any', attributes: '*' },
		{ resource: 'array', action: 'read:any', attributes: '*' },
		{ resource: 'cpu', action: 'read:any', attributes: '*' },
		{ resource: 'device', action: 'read:any', attributes: '*' },
		{ resource: 'device/unassigned', action: 'read:any', attributes: '*' },
		{ resource: 'disk', action: 'read:any', attributes: '*' },
		{ resource: 'disk/settings', action: 'read:any', attributes: '*' },
		{ resource: 'display', action: 'read:any', attributes: '*' },
		{ resource: 'docker/container', action: 'read:any', attributes: '*' },
		{ resource: 'docker/network', action: 'read:any', attributes: '*' },
		{ resource: 'info', action: 'read:any', attributes: '*' },
		{ resource: 'license-key', action: 'read:any', attributes: '*' },
		{ resource: 'machine-id', action: 'read:any', attributes: '*' },
		{ resource: 'memory', action: 'read:any', attributes: '*' },
		{ resource: 'online', action: 'read:any', attributes: '*' },
		{ resource: 'os', action: 'read:any', attributes: '*' },
		{ resource: 'parity-history', action: 'read:any', attributes: '*' },
		{ resource: 'permission', action: 'read:any', attributes: '*' },
		{ resource: 'plugin', action: 'read:any', attributes: '*' },
		{ resource: 'servers', action: 'read:any', attributes: '*' },
		{ resource: 'service', action: 'read:any', attributes: '*' },
		{ resource: 'service/emhttpd', action: 'read:any', attributes: '*' },
		{ resource: 'service/unraid-api', action: 'read:any', attributes: '*' },
		{ resource: 'services', action: 'read:any', attributes: '*' },
		{ resource: 'share', action: 'read:any', attributes: '*' },
		{ resource: 'software-versions', action: 'read:any', attributes: '*' },
		{ resource: 'unraid-version', action: 'read:any', attributes: '*' },
		{ resource: 'uptime', action: 'read:any', attributes: '*' },
		{ resource: 'user', action: 'read:any', attributes: '*' },
		{ resource: 'var', action: 'read:any', attributes: '*' },
		{ resource: 'vars', action: 'read:any', attributes: '*' },
		{ resource: 'vm/domain', action: 'read:any', attributes: '*' },
		{ resource: 'vm/network', action: 'read:any', attributes: '*' }
	]
};

export const user = {
	extends: 'guest',
	permissions: [
		{ resource: 'apikey', action: 'read:own', attributes: '*' },
	    { resource: 'permission', action: 'read:any', attributes: '*' }
	]
};

export const guest = {
	permissions: [
		{ resource: 'welcome', action: 'read:any', attributes: '*' }
	]
};

export const permissions = {
	admin,
	user,
	guest
};
