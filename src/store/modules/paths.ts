import { createSlice } from '@reduxjs/toolkit';

const initialState = {
	core: __dirname,
	'unraid-api-base': '/usr/local/bin/unraid-api/' as const,
	'unraid-version': '/etc/unraid-version' as const,
	'unraid-data': process.env.PATHS_UNRAID_DATA ?? '/boot/config/plugins/dynamix.my.servers/data/' as const,
	'docker-autostart': '/var/lib/docker/unraid-autostart' as const,
	'docker-socket': '/var/run/docker.sock' as const,
	'parity-checks': '/boot/config/parity-checks.log' as const,
	htpasswd: '/etc/nginx/htpasswd' as const,
	'emhttpd-socket': '/var/run/emhttpd.socket' as const,
	states: process.env.PATHS_STATES ?? '/usr/local/emhttp/state/' as const,
	'nginx-state': '/usr/local/emhttp/state/nginx.ini' as const,
	'dynamix-base': process.env.PATHS_DYNAMIX_BASE ?? '/boot/config/plugins/dynamix/' as const,
	'dynamix-config': process.env.PATH_DYNAMIX_CONFIG ?? '/boot/config/plugins/dynamix/dynamix.cfg' as const,
	'myservers-base': '/boot/config/plugins/dynamix.my.servers/' as const,
	'myservers-config': process.env.PATHS_MY_SERVERS_CONFIG ?? '/boot/config/plugins/dynamix.my.servers/myservers.cfg' as const,
	'myservers-env': '/boot/config/plugins/dynamix.my.servers/env' as const,
};

export const paths = createSlice({
	name: 'paths',
	initialState,
	reducers: {},
});
