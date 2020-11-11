/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

export interface Paths {
	core: string;
	plugins: string;
	htpasswd: string;
	states: string;
	'unraid-version': string;
	'unraid-data': string;
	'docker-autostart': string;
	'docker-socket': string;
	'parity-checks': string;
	'emhttpd-socket': string;
	'dynamix-base': string;
	'dynamix-config': string;
	'nginx-origin': string;
	'machine-id': string;
}

const thisDir = __dirname;

// This will allow `PATHS_` to be set an as env
// e.g. unraid-version = PATHS_UNRAID_VERSION
const addEnvPaths = ([key, value]: [keyof Paths, string]): [keyof Paths, string] => {
	const fullKey = `PATHS_${key.replace('-', '_').toUpperCase()}`;
	return [key, process.env[fullKey] ?? value];
};

/**
 * Default paths.
 *
 * @name Paths
 */
export const defaultPaths = new Map<keyof Paths, string>([
	['core', thisDir],
	['unraid-version', '/etc/unraid-version'],
	['unraid-data', '/boot/config/plugins/Unraid.net/data'],
	['docker-autostart', '/var/lib/docker/unraid-autostart'],
	['docker-socket', '/var/run/docker.sock'],
	['parity-checks', '/boot/config/parity-checks.log'],
	['htpasswd', '/etc/nginx/htpasswd'],
	['emhttpd-socket', '/var/run/emhttpd.socket'],
	['states', '/usr/local/emhttp/state/'],
	['dynamix-base', '/boot/config/plugins/dynamix/'],
	['dynamix-config', '/boot/config/plugins/dynamix/dynamix.cfg'],
	['nginx-origin', '/var/run/nginx.origin'],
	['machine-id', '/etc/machine-id']
]);

/**
 * A path mapper.
 *
 * @name Paths
 */
export const paths = new Map<keyof Paths, string>([...defaultPaths.entries()].map(addEnvPaths));
