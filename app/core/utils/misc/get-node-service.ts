import fs from 'fs';
import path from 'path';
import execa from 'execa';
import { JSONSchemaForNPMPackageJsonFiles as PackageJson } from '@schemastore/package';
import { coreLogger } from '../../log';
import { User } from '../../types';
import { CacheManager } from '../../cache-manager';
import { cleanStdout, ensurePermission } from '../../utils';

export interface NodeService {
	online?: boolean;
	uptime?: number;
	version?: string;
}

const getUptime = async (pid: string | number) => {
	const uptime = await execa('ps', ['-p', String(pid), '-o', 'etimes', '--no-headers'])
		.then(cleanStdout)
		.catch(async error => {
			// No clue why this failed
			if (!error.stderr.includes('keyword not found')) {
				return '';
			}

			// Retry with macos way
			// Borrowed from https://stackoverflow.com/a/28856613
			const command = `ps -p ${pid} -oetime= | tr '-' ':' | awk -F: '{ total=0; m=1; } { for (i=0; i < NF; i++) {total += $(NF-i)*m; m *= i >= 2 ? 24 : 60 }} {print total}'`;
			return execa.command(command, { shell: true }).then(cleanStdout).catch(() => '');
		});

	const parsedUptime = Number.parseInt(uptime, 10);
	return parsedUptime >= 0 ? parsedUptime : -1;
};

const getCachedValue = (cache: CacheManager, name: string) => {
	return cache.get<string>(name);
};

const setCachedValue = (cache: CacheManager, name: string, value: string) => {
	cache.set(name, value);
	return value;
};

const getPid = async (cache: CacheManager, namespace: string): Promise<string | void> => {
	let pid = getCachedValue(cache, 'pid');

	// Return cached pid
	if (pid) {
		return pid;
	}

	coreLogger.debug('No PID found in cache for %s', namespace);
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
				return execa.command('ps axc').then(({ stdout }) => {
					const foundProcess = stdout.split(/\n/).find(line => {
						const field = line.trim().split(/\s+/)[4];
						return field === namespace;
					})?.trim();
					return foundProcess ? foundProcess.split(/\s/)[0] : '';
				});
			}

			return '';
		});

	// Process is offline
	if (!pid) {
		return;
	}

	// If we got more than 1 pid back we may have just started
	// because of this we need to make sure we return the "newest" pid
	const pids = pid.split(' ');
	if (pids.length >= 2) {
		const uptimePromises = pids.map(async (pid): Promise<[string, number]> => [pid, await getUptime(pid)]);
		const uptimeEntries = await Promise.all(uptimePromises);
		const uptimes = uptimeEntries.sort((a, b) => a[1] - b[1]);
		const newestPid = uptimes[0][0];
		pid = newestPid;
	}

	// Log for debugging
	coreLogger.debug('Setting pid for %s to %s', namespace, pid);

	// Update cache
	setCachedValue(cache, 'pid', pid);

	// Return new pid
	return pid;
};

const getPkgFilePath = async (namespace: string, pid: number | string) => {
	coreLogger.debug('Getting package.json path for %s', namespace);

	return execa.command(`pwdx ${pid}`).then(({ stdout }) => {
		return path.resolve(stdout.split(/\n/)[0].split(':')[1].trim());
	}).catch(async error => {
		if (error.code === 'ENOENT') {
			return execa.command(`lsof -a -d cwd -p ${pid} -n -Fn`).then(({ stdout }) => stdout.split(/\n/)[2].substr(1));
		}

		return '';
	});
};

const getVersion = async (cache: CacheManager, namespace: string, pid: number | string) => {
	let cachedVersion = getCachedValue(cache, 'version');

	// Return cached version
	if (cachedVersion) {
		return cachedVersion;
	}

	// Update local vars
	const pkgFilePath = await getPkgFilePath(namespace, pid);
	const version = await fs.promises.readFile(`${pkgFilePath}/package.json`)
		.then(buffer => buffer.toString())
		.then(JSON.parse)
		.then((pkg: PackageJson) => pkg.version);

	if (!version) {
		return;
	}

	// Update cache
	setCachedValue(cache, 'version', version);
	return version;
};

const getService = async (user: User, namespace: string, retryAttempt = 0): Promise<NodeService> => {
	// Allow 5 attempts before bailing
	// We check for 4 as this is "first try" + 4 retries
	if (retryAttempt === 4) {
		coreLogger.error(`Failed resolving pid for ${namespace}`);

		// We really shouldn't hit this
		return {
			online: false,
			uptime: 0,
			version: 'UNKNOWN'
		};
	}

	// Grab a cache to store the pid in
	const cache = new CacheManager(`unraid:services/${namespace}`, Infinity);

	// Attempt to get pid from cache or lookup
	let pid = await getPid(cache, namespace);

	// If the pid doesn't exist it's offline
	if (!pid) {
		// Retry?
		return getService(user, namespace, retryAttempt + 1);
	}

	// Get version, uptime and online status
	const version = await getVersion(cache, namespace, pid);
	const uptime = await getUptime(pid);
	const online = uptime >= 1;

	// Log
	coreLogger.silly('%s version=%s uptime=%s online=%s', namespace, version, uptime, online);

	return {
		online,
		uptime,
		version
	};
};

export const getNodeService = async (user: User, namespace: string): Promise<NodeService> => {
	// Check permissions
	ensurePermission(user, {
		resource: `service/${namespace}`,
		action: 'read',
		possession: 'any'
	});

	return getService(user, namespace);
};
