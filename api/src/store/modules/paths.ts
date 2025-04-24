import { join, resolve as resolvePath } from 'path';

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    core: import.meta.dirname,
    'unraid-api-base': '/usr/local/unraid-api/' as const,
    'unraid-data': resolvePath(
        process.env.PATHS_UNRAID_DATA ?? ('/boot/config/plugins/dynamix.my.servers/data/' as const)
    ),
    'docker-autostart': '/var/lib/docker/unraid-autostart' as const,
    'docker-socket': '/var/run/docker.sock' as const,
    'parity-checks': resolvePath(
        process.env.PATHS_PARITY_CHECKS ?? ('/boot/config/parity-checks.log' as const)
    ),
    htpasswd: '/etc/nginx/htpasswd' as const,
    'emhttpd-socket': '/var/run/emhttpd.socket' as const,
    states: resolvePath(process.env.PATHS_STATES ?? ('/usr/local/emhttp/state/' as const)),
    'dynamix-base': resolvePath(
        process.env.PATHS_DYNAMIX_BASE ?? ('/boot/config/plugins/dynamix/' as const)
    ),
    'dynamixCaseModelConfig': resolvePath(
        process.env.PATHS_DYNAMIX_CASE_MODEL_CONFIG ??
            ('/boot/config/plugins/dynamix/case-model.cfg' as const)
    ),

    /**------------------------------------------------------------------------
     *                             Resolving Plugin Configs
     *
     *  Plugins have a default config and, optionally, a user-customized config.
     *  You have to merge them to resolve a the correct config.
     *
     * i.e. the plugin author can update or change defaults without breaking user configs
     *
     * Thus, we've described this plugin's config paths as a list. The order matters!
     * Config data in earlier paths will be overwritten by configs from later paths.
     *
     * See [the original PHP implementation.](https://github.com/unraid/webgui/blob/95c6913c62e64314b985e08222feb3543113b2ec/emhttp/plugins/dynamix/include/Wrappers.php#L42)
     *
     * Here, the first path in the list is the default config.
     * The second is the user-customized config.
     *
     *------------------------------------------------------------------------**/
    'dynamix-config': [
        resolvePath(
            process.env.PATHS_DYNAMIX_CONFIG_DEFAULT ??
                ('/usr/local/emhttp/plugins/dynamix/default.cfg' as const)
        ),
        resolvePath(
            process.env.PATHS_DYNAMIX_CONFIG ?? ('/boot/config/plugins/dynamix/dynamix.cfg' as const)
        ),
    ],
    'myservers-base': '/boot/config/plugins/dynamix.my.servers/' as const,
    'myservers-config': resolvePath(
        process.env.PATHS_MY_SERVERS_CONFIG ??
            ('/boot/config/plugins/dynamix.my.servers/myservers.cfg' as const)
    ),
    'myservers-config-states': join(
        resolvePath(process.env.PATHS_STATES ?? ('/usr/local/emhttp/state/' as const)),
        'myservers.cfg' as const
    ),
    'myservers-env': '/boot/config/plugins/dynamix.my.servers/env' as const,
    'myservers-keepalive':
        process.env.PATHS_MY_SERVERS_FB ??
        ('/boot/config/plugins/dynamix.my.servers/fb_keepalive' as const),
    'keyfile-base': resolvePath(process.env.PATHS_KEYFILE_BASE ?? ('/boot/config' as const)),
    'machine-id': resolvePath(process.env.PATHS_MACHINE_ID ?? ('/var/lib/dbus/machine-id' as const)),
    'log-base': resolvePath('/var/log/unraid-api/' as const),
    'unraid-log-base': resolvePath('/var/log/' as const),
    'var-run': '/var/run' as const,
    // contains sess_ files that correspond to authenticated user sessions
    'auth-sessions': process.env.PATHS_AUTH_SESSIONS ?? '/var/lib/php',
    'auth-keys': resolvePath(
        process.env.PATHS_AUTH_KEY ?? ('/boot/config/plugins/dynamix.my.servers/keys' as const)
    ),
    'libvirt-pid': '/var/run/libvirt/libvirtd.pid' as const,
    // Customization paths
    'activationBase': '/boot/config/activation' as const,
    'webguiImagesBase': '/usr/local/emhttp/webGui/images' as const,
    'identConfig': resolvePath(process.env.PATHS_IDENT_CONFIG ?? ('/boot/config/ident.cfg' as const)),
};

export const paths = createSlice({
    name: 'paths',
    initialState,
    reducers: {},
});
