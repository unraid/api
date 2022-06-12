/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

/**
 * Default paths.
 *
 * @name Paths
 */
export const paths = {
	core: __dirname,
	'unraid-api-base': '/usr/local/bin/unraid-api/' as const,
	'unraid-version': '/etc/unraid-version' as const,
	'unraid-data': '/boot/config/plugins/dynamix.my.servers/data/' as const,
	'docker-autostart': '/var/lib/docker/unraid-autostart' as const,
	'docker-socket': '/var/run/docker.sock' as const,
	'parity-checks': '/boot/config/parity-checks.log' as const,
	htpasswd: '/etc/nginx/htpasswd' as const,
	'emhttpd-socket': '/var/run/emhttpd.socket' as const,
	states: '/usr/local/emhttp/state/' as const,
	'nginx-state': '/usr/local/emhttp/state/nginx.ini' as const,
	'dynamix-base': '/boot/config/plugins/dynamix/' as const,
	'dynamix-config': '/boot/config/plugins/dynamix/dynamix.cfg' as const,
	'myservers-base': '/boot/config/plugins/dynamix.my.servers/' as const,
	'myservers-config': '/boot/config/plugins/dynamix.my.servers/myservers.cfg' as const,
	'myservers-env': '/boot/config/plugins/dynamix.my.servers/env' as const
};
