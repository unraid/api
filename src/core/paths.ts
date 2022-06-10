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
	'unraid-api-base': '/usr/local/bin/unraid-api/',
	'unraid-version': '/etc/unraid-version',
	'unraid-data': '/boot/config/plugins/dynamix.my.servers/data/',
	'docker-autostart': '/var/lib/docker/unraid-autostart',
	'docker-socket': '/var/run/docker.sock',
	'parity-checks': '/boot/config/parity-checks.log',
	htpasswd: '/etc/nginx/htpasswd',
	'emhttpd-socket': '/var/run/emhttpd.socket',
	states: '/usr/local/emhttp/state/',
	'nginx-state': '/usr/local/emhttp/state/nginx.ini',
	'dynamix-base': '/boot/config/plugins/dynamix/',
	'dynamix-config': '/boot/config/plugins/dynamix/dynamix.cfg',
	'myservers-base': '/boot/config/plugins/dynamix.my.servers/',
	'myservers-config': '/boot/config/plugins/dynamix.my.servers/myservers.cfg',
	'myservers-env': '/boot/config/plugins/dynamix.my.servers/env'
};
