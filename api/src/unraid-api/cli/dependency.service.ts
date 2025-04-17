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

    async npmInstall(): Promise<void> {
        const packageJsonPath = getPackageJsonPath();
        await execa(`npm install`, { cwd: path.dirname(packageJsonPath) });
    }

    async rebuildVendorArchive(): Promise<void> {
        const rcUnraidApi = '/etc/rc.d/rc.unraid-api';
        if (!(await fileExists(rcUnraidApi))) {
            this.logger.error('[rebuild-vendor-archive] rc.unraid-api not found; no action taken!');
            return;
        }
        await execa(rcUnraidApi, ['archive-dependencies']);
    }
}
