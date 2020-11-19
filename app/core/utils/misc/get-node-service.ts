import fs from 'fs';
import path from 'path';
import execa from 'execa';
import { JSONSchemaForNPMPackageJsonFiles as PackageJson} from '@schemastore/package';
import { coreLogger, log } from '../../log';
import { User } from '../../types';
import { CacheManager } from '../../cache-manager';
import { cleanStdout, ensurePermission } from '../../utils';

export interface NodeService {
    online?: boolean;
    uptime?: number;
    version?: string;
}

export const getNodeService = async (user: User, namespace: string): Promise<NodeService> => {
    // Check permissions
    ensurePermission(user, {
        resource: `service/${namespace}`,
        action: 'read',
        possession: 'any'
    });

    const cache = new CacheManager(`unraid:services/${namespace}`, Infinity);

    const getCachedValue = (name: string) => {
        return cache.get<string>(name);
    };

    const setCachedValue = (name: string, value: string) => {
        cache.set(name, value);
        return value;
    };

    const getUptime = async (pid: string | number) => {
        const uptime = await execa('ps', ['-p', String(pid), '-o', 'etimes', '--no-headers'])
            .then(cleanStdout)
            .catch(() => '');

        const parsedUptime = Number.parseInt(uptime, 10);
        return parsedUptime >= 0 ? parsedUptime : -1;
    };

    const getPid = async (): Promise<string | void> => {
        let pid = getCachedValue('pid');

        // Return cached pid
        if (pid) {
            return pid;
        }

        coreLogger.trace(`No PID found in cache for ${namespace}`);
        pid = await execa.command(`pidof ${namespace}`)
            .then(output => {
                const pids = cleanStdout(output).split('\n');
                return pids[0];
            })
            .catch(async error => {
                // `pidof` is missing
                if (error.code === 'ENOENT') {
                    // Fall back to using ps
                    // ps axc returns a line like the following
                    // 31424 s005  S+     0:01.66 node
                    // We match the last column and return the first
                    return execa.command('ps axc').then(({stdout}) => {
                        const foundProcess = stdout.split(/\n/).find(line => {
                            const field = line.split(/\s+/)[4];
                            return field === namespace;
                        });
                        return foundProcess ? foundProcess.split(/\s/)[0] : '';
                    });
                }

                return '';
            });

        // Process is offline
        if (!pid) {
            return;
        }

        // Update cache
        setCachedValue('pid', pid);

        // Return new pid
        return pid;
    };

    const getPkgFilePath = async (pid: number | string) => {
        coreLogger.debug('Getting package.json path for %s', namespace);

        return execa.command(`pwdx ${pid}`).then(({ stdout }) => {
            return path.resolve(stdout.split(/\n/)[0].split(':')[1].trim());
        }).catch(async error =>{
            if (error.code === 'ENOENT') {
                return execa.command(`lsof -a -d cwd -p ${pid} -n -Fn`).then(({ stdout }) => stdout.split(/\n/)[2].substr(1));
            }

            return '';
        });
    };

    const getVersion = async (pid: number | string) => {
        let cachedVersion = getCachedValue('version');

        // Return cached version
        if (cachedVersion) {
            return cachedVersion;
        }

        // Update local vars
        const pkgFilePath = await getPkgFilePath(pid);
        const version = await fs.promises.readFile(`${pkgFilePath}/package.json`)
            .then(buffer => buffer.toString())
            .then(JSON.parse)
            .then((pkg: PackageJson) => pkg.version);

        if (!version) {
            return;
        }

        // Update cache
        setCachedValue('version', version);
        return version;
    };

    const pid = await getPid();

    // If the pid doesn't exist it's offline
    if (!pid) {
        return {
            online: false
        };
    }

    const version = await getVersion(pid);
    const uptime = await getUptime(pid);
    const online = uptime >= 1;

    return {
        online,
        uptime,
        version
    };
};
