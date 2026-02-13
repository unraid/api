import { join, resolve as resolvePath } from 'path';

import { createSlice } from '@reduxjs/toolkit';

import { convertWebGuiPathToAssetPath } from '@app/utils.js';

// Helper function for creating asset paths
const createAssetPath = (imagesBase: string, filename: string) => {
    const fullPath = join(imagesBase, filename);
    return {
        fullPath,
        assetPath: convertWebGuiPathToAssetPath(fullPath),
    };
};

const initialState = {
    core: import.meta.dirname,
    'unraid-api-base': '/usr/local/unraid-api/' as const,
    'unraid-data': resolvePath(
        process.env.PATHS_UNRAID_DATA ?? ('/boot/config/plugins/dynamix.my.servers/data/' as const)
    ),
    'docker-autostart': '/var/lib/docker/unraid-autostart' as const,
    'docker-userprefs': '/boot/config/plugins/dockerMan/userprefs.cfg' as const,
    'docker-socket': '/var/run/docker.sock' as const,
    'rclone-socket': resolvePath(process.env.PATHS_RCLONE_SOCKET ?? ('/var/run/rclone.socket' as const)),
    'parity-checks': resolvePath(
        process.env.PATHS_PARITY_CHECKS ?? ('/boot/config/parity-checks.log' as const)
    ),
    htpasswd: '/etc/nginx/htpasswd' as const,
    'emhttpd-socket': '/var/run/emhttpd.socket' as const,
    states: resolvePath(process.env.PATHS_STATES ?? ('/usr/local/emhttp/state/' as const)),
    'dynamix-base': resolvePath(
        process.env.PATHS_DYNAMIX_BASE ?? ('/boot/config/plugins/dynamix/' as const)
    ),
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
    'myservers-keepalive':
        process.env.PATHS_MY_SERVERS_FB ??
        ('/boot/config/plugins/dynamix.my.servers/fb_keepalive' as const),
    'keyfile-base': resolvePath(process.env.PATHS_KEYFILE_BASE ?? ('/boot/config' as const)),
    'machine-id': resolvePath(process.env.PATHS_MACHINE_ID ?? ('/var/lib/dbus/machine-id' as const)),
    'log-base': process.env.PATHS_LOG_BASE ?? resolvePath('/var/log/unraid-api/' as const),
    'unraid-log-base': process.env.PATHS_UNRAID_LOG_BASE ?? resolvePath('/var/log/' as const),
    'var-run': '/var/run' as const,
    // contains sess_ files that correspond to authenticated user sessions
    'auth-sessions': process.env.PATHS_AUTH_SESSIONS ?? '/var/lib/php',
    'auth-keys': resolvePath(
        process.env.PATHS_AUTH_KEY ?? ('/boot/config/plugins/dynamix.my.servers/keys' as const)
    ),
    passwd: resolvePath(process.env.PATHS_PASSWD ?? ('/boot/config/passwd' as const)),
    'libvirt-pid': '/var/run/libvirt/libvirtd.pid' as const,
    // Customization paths
    activationBase: resolvePath(process.env.PATHS_ACTIVATION_BASE ?? ('/boot/config/activate' as const)),
    webGuiBase: '/usr/local/emhttp/webGui' as const,
    identConfig: resolvePath(process.env.PATHS_IDENT_CONFIG ?? ('/boot/config/ident.cfg' as const)),
};

// Derive asset paths from base paths
const derivedPaths = {
    activation: {
        assets: join(initialState.activationBase, 'assets'),
        get logo() {
            return join(this.assets, 'logo.svg');
        },
        get caseModel() {
            return join(this.assets, 'case-model.png');
        },
        get banner() {
            return join(this.assets, 'banner.png');
        },
    },
    boot: {
        get caseModel() {
            return join(initialState['dynamix-base'], 'case-model.png');
        },
        get caseModelConfig() {
            return join(initialState['dynamix-base'], 'case-model.cfg');
        },
    },
    webgui: {
        imagesBase: join(initialState.webGuiBase, 'images'),
        get logo() {
            return createAssetPath(this.imagesBase, 'UN-logotype-gradient.svg');
        },
        get caseModel() {
            return createAssetPath(this.imagesBase, 'case-model.png');
        },
        get banner() {
            return createAssetPath(this.imagesBase, 'banner.png');
        },
    },
};

// Combine initial and derived paths
const combinedState = { ...initialState, ...derivedPaths };

export const paths = createSlice({
    name: 'paths',
    initialState: combinedState,
    reducers: {},
});
