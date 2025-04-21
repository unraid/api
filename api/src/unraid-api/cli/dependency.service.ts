import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import type { PackageJson } from 'type-fest';
import { execa } from 'execa';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { getPackageJson, getPackageJsonPath } from '@app/environment.js';
import { LogService } from '@app/unraid-api/cli/log.service.js';

@Injectable()
export class DependencyService {
    constructor(private readonly logger: LogService) {}

    /**
     * Writes the package.json file for the api.
     *
     * @param data - The data to write to the package.json file.
     * @throws {Error} from fs.writeFile if the file cannot be written.
     */
    private async writePackageJson(data: PackageJson): Promise<void> {
        const packageJsonPath = getPackageJsonPath();
        await fs.writeFile(packageJsonPath, JSON.stringify(data, null, 2) + '\n');
    }

    // Basic parser, assumes format 'name' or 'name@version'
    private parsePackageArg(packageArg: string): { name: string; version?: string } {
        const atIndex = packageArg.lastIndexOf('@');
        // Handles scoped packages @scope/pkg or @scope/pkg@version and simple pkg@version
        if (atIndex > 0) {
            // Ensure '@' is not the first character
            const name = packageArg.substring(0, atIndex);
            const version = packageArg.substring(atIndex + 1);
            // Basic check if version looks like a version (simplistic)
            if (version && !version.includes('/')) {
                // Avoid treating part of scope as version
                return { name, version };
            }
        }
        return { name: packageArg }; // No version or scoped package without version
    }

    /**
     * Adds a peer dependency to the api. If bundled is true, the vendored package will be used.
     * Note that this function does not check whether the package is, in fact, bundled.
     *
     * @param packageArg - The package name and version to add.
     * @param bundled - Whether the package is bundled with the api.
     * @returns The name, version, and bundled status of the added dependency.
     */
    async addPeerDependency(
        packageArg: string,
        bundled: boolean
    ): Promise<{ name: string; version: string; bundled: boolean }> {
        const { name, version } = this.parsePackageArg(packageArg);
        if (!name) {
            throw new Error('Invalid package name provided.');
        }
        const packageJson = getPackageJson();
        packageJson.peerDependencies = packageJson.peerDependencies ?? {};
        let finalVersion = '';

        if (bundled) {
            finalVersion = 'workspace:*';
            packageJson.peerDependencies[name] = finalVersion;
            packageJson.peerDependenciesMeta = packageJson.peerDependenciesMeta ?? {};
            packageJson.peerDependenciesMeta[name] = { optional: true };
            await this.writePackageJson(packageJson);
            return { name, version: finalVersion, bundled };
        }

        finalVersion = version || '*';
        packageJson.peerDependencies[name] = finalVersion;
        if (packageJson.peerDependenciesMeta?.[name]) {
            delete packageJson.peerDependenciesMeta[name];
        }
        await this.writePackageJson(packageJson);
        return { name, version: finalVersion, bundled };
    }

    /**
     * Removes a peer dependency from the api.
     *
     * @param packageName - The name of the package to remove.
     * @throws {Error} if the package name is invalid.
     */
    async removePeerDependency(packageName: string): Promise<void> {
        const packageJson = getPackageJson();
        const { name } = this.parsePackageArg(packageName);
        if (!name) {
            throw new Error('Invalid package name provided.');
        }

        if (packageJson.peerDependencies?.[name]) {
            delete packageJson.peerDependencies[name];
            this.logger.log(`Removed peer dependency ${name}`);
        } else {
            this.logger.warn(`Peer dependency ${name} not found.`);
        }

        if (packageJson.peerDependenciesMeta?.[name]) {
            delete packageJson.peerDependenciesMeta[name];
        }

        await this.writePackageJson(packageJson);
    }

    /**
     * Installs dependencies for the api using npm.
     *
     * @throws {Error} from execa if the npm install command fails.
     */
    async npmInstall(): Promise<void> {
        const packageJsonPath = getPackageJsonPath();
        await execa(`npm install`, { cwd: path.dirname(packageJsonPath) });
    }

    /**
     * Rebuilds the vendored dependency archive for the api and stores it on the boot drive.
     * If the rc.unraid-api script is not found, no action is taken, but a warning is logged.
     *
     * @throws {Error} from execa if the rc.unraid-api command fails.
     */
    async rebuildVendorArchive(): Promise<void> {
        const rcUnraidApi = '/etc/rc.d/rc.unraid-api';
        if (!(await fileExists(rcUnraidApi))) {
            this.logger.error('[rebuild-vendor-archive] rc.unraid-api not found; no action taken!');
            return;
        }
        await execa(rcUnraidApi, ['archive-dependencies']);
    }
}
