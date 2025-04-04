import { Injectable } from '@nestjs/common';
import { join, resolve as resolvePath } from 'path';

@Injectable()
export class PathsConfig {
    private static instance: PathsConfig;

    readonly core = import.meta.dirname;
    readonly unraidApiBase = '/usr/local/unraid-api/';
    readonly unraidData = resolvePath(
        process.env.PATHS_UNRAID_DATA ?? '/boot/config/plugins/dynamix.my.servers/data/'
    );
    readonly dockerAutostart = '/var/lib/docker/unraid-autostart';
    readonly dockerSocket = '/var/run/docker.sock';
    readonly parityChecks = '/boot/config/parity-checks.log';
    readonly htpasswd = '/etc/nginx/htpasswd';
    readonly emhttpdSocket = '/var/run/emhttpd.socket';
    readonly states = resolvePath(process.env.PATHS_STATES ?? '/usr/local/emhttp/state/');
    readonly dynamixBase = resolvePath(
        process.env.PATHS_DYNAMIX_BASE ?? '/boot/config/plugins/dynamix/'
    );

    /**
     * Plugins have a default config and, optionally, a user-customized config.
     * You have to merge them to resolve a the correct config.
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
     */
    readonly dynamixConfig = [
        resolvePath(
            process.env.PATHS_DYNAMIX_CONFIG_DEFAULT ??
                '/usr/local/emhttp/plugins/dynamix/default.cfg'
        ),
        resolvePath(
            process.env.PATHS_DYNAMIX_CONFIG ?? '/boot/config/plugins/dynamix/dynamix.cfg'
        ),
    ];

    readonly myserversBase = '/boot/config/plugins/dynamix.my.servers/';
    readonly myserversConfig = resolvePath(
        process.env.PATHS_MY_SERVERS_CONFIG ??
            '/boot/config/plugins/dynamix.my.servers/myservers.cfg'
    );
    readonly myserversConfigStates = join(
        resolvePath(process.env.PATHS_STATES ?? '/usr/local/emhttp/state/'),
        'myservers.cfg'
    );
    readonly myserversEnv = '/boot/config/plugins/dynamix.my.servers/env';
    readonly myserversKeepalive =
        process.env.PATHS_MY_SERVERS_FB ??
        '/boot/config/plugins/dynamix.my.servers/fb_keepalive';
    readonly keyfileBase = resolvePath(process.env.PATHS_KEYFILE_BASE ?? '/boot/config');
    readonly machineId = resolvePath(process.env.PATHS_MACHINE_ID ?? '/var/lib/dbus/machine-id');
    readonly logBase = resolvePath('/var/log/unraid-api/');
    readonly unraidLogBase = resolvePath('/var/log/');
    readonly varRun = '/var/run';
    readonly authSessions = process.env.PATHS_AUTH_SESSIONS ?? '/var/lib/php';
    readonly authKeys = resolvePath(
        process.env.PATHS_AUTH_KEY ?? '/boot/config/plugins/dynamix.my.servers/keys'
    );

    // Singleton access
    static getInstance(): PathsConfig {
        if (!PathsConfig.instance) {
            PathsConfig.instance = new PathsConfig();
        }
        return PathsConfig.instance;
    }
} 