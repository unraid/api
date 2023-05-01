import { createSlice } from '@reduxjs/toolkit';
import { join, resolve as resolvePath } from 'path';

const initialState = {
	core: __dirname,
	'unraid-api-base': '/usr/local/bin/unraid-api/' as const,
	'unraid-version': resolvePath(process.env.PATHS_UNRAID_VERSION ?? '/etc/unraid-version' as const),
	'unraid-data': resolvePath(process.env.PATHS_UNRAID_DATA ?? '/boot/config/plugins/dynamix.my.servers/data/' as const),
	'docker-autostart': '/var/lib/docker/unraid-autostart' as const,
	'var-run': '/var/run' as const,
	'docker-socket': '/var/run/docker.sock' as const,
	'parity-checks': '/boot/config/parity-checks.log' as const,
	htpasswd: '/etc/nginx/htpasswd' as const,
	'emhttpd-socket': '/var/run/emhttpd.socket' as const,
	states: resolvePath(process.env.PATHS_STATES ?? '/usr/local/emhttp/state/' as const),
	'dynamix-base': resolvePath(process.env.PATHS_DYNAMIX_BASE ?? '/boot/config/plugins/dynamix/' as const),
	'dynamix-config': resolvePath(process.env.PATHS_DYNAMIX_CONFIG ?? '/boot/config/plugins/dynamix/dynamix.cfg' as const),
	'myservers-base': '/boot/config/plugins/dynamix.my.servers/' as const,
	'myservers-config': resolvePath(process.env.PATHS_MY_SERVERS_CONFIG ?? '/boot/config/plugins/dynamix.my.servers/myservers.cfg' as const),
	'myservers-config-states': join(resolvePath(process.env.PATHS_STATES ?? '/usr/local/emhttp/state/' as const), 'myservers.cfg' as const),
	'myservers-env': '/boot/config/plugins/dynamix.my.servers/env' as const,
	'keyfile-base': resolvePath(process.env.PATHS_KEYFILE_BASE ?? '/boot/config' as const),
	'machine-id': resolvePath(process.env.PATHS_MACHINE_ID ?? '/var/lib/dbus/machine-id' as const),
	'log-base': resolvePath('/var/log/unraid-api/' as const)
};

export const paths = createSlice({
	name: 'paths',
	initialState,
	reducers: {},
});
