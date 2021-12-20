/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

export interface Paths {
	core: string;
	plugins: string;
	htpasswd: string;
	states: string;
	'unraid-api-base': string;
	'unraid-version': string;
	'unraid-data': string;
	'docker-autostart': string;
	'docker-socket': string;
	'parity-checks': string;
	'emhttpd-socket': string;
	'dynamix-base': string;
	'dynamix-config': string;
	'myservers-base': string;
	'myservers-config': string;
	'myservers-env': string;
	'non-wildcard-ssl-certificate': string;
	'wildcard-ssl-certificate': string;
}

const thisDir = __dirname;

// This will allow `PATHS_` to be set an as env
// e.g. unraid-version = PATHS_UNRAID_VERSION
const addEnvPaths = ([key, value]: [keyof Paths, string]): [keyof Paths, string] => {
	const fullKey = `PATHS_${key.replace(/-/g, '_').toUpperCase()}`;
	return [key, process.env[fullKey] ?? value];
};

/**
 * Default paths.
 *
 * @name Paths
 */
export const defaultPaths = new Map<keyof Paths, string>([
	['core', thisDir],
	['unraid-api-base', '/usr/local/bin/unraid-api/'],
	['unraid-version', '/etc/unraid-version'],
	['unraid-data', '/boot/config/plugins/dynamix.my.servers/data/'],
	['docker-autostart', '/var/lib/docker/unraid-autostart'],
	['docker-socket', '/var/run/docker.sock'],
	['parity-checks', '/boot/config/parity-checks.log'],
	['htpasswd', '/etc/nginx/htpasswd'],
	['emhttpd-socket', '/var/run/emhttpd.socket'],
	['states', '/usr/local/emhttp/state/'],
	['dynamix-base', '/boot/config/plugins/dynamix/'],
	['dynamix-config', '/boot/config/plugins/dynamix/dynamix.cfg'],
	['myservers-base', '/boot/config/plugins/dynamix.my.servers/'],
	['myservers-config', '/boot/config/plugins/dynamix.my.servers/myservers.cfg'],
	['myservers-env', '/boot/config/plugins/dynamix.my.servers/env'],
	['non-wildcard-ssl-certificate', '/boot/config/ssl/certs/certificate_bundle.pem'],
	['wildcard-ssl-certificate', '/boot/config/ssl/certs/myunraid_bundle.pem']
]);

/**
 * A path mapper.
 *
 * @name Paths
 */
export const paths = new Map<keyof Paths, string>([...defaultPaths.entries()].map(addEnvPaths));
