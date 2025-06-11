import { Injectable } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';

import type { PackageJson } from 'type-fest';
import { execa } from 'execa';

import { fileExists } from '@app/core/utils/files/file-exists.js';
import { getPackageJson, getPackageJsonPath } from '@app/environment.js';

@Injectable()
export class DependencyService {
    constructor() {}

    /**
     * Executes an npm command.
     *
     * @param npmArgs - The arguments to pass to npm.
     * @returns The execa result of the npm command.
     */
    async npm(...npmArgs: string[]) {
        return await execa('npm', [...npmArgs], {
            stdio: 'inherit',
            cwd: path.dirname(getPackageJsonPath()),
        });
    }

    /**
     * Installs plugins using npm.
     *
     * @param plugins - The plugins to install.
     * @returns The execa result of the npm command.
     */
    installPlugins(...plugins: string[]) {
        return this.npm('i', '--save-peer', '--save-exact', ...plugins);
    }

    /**
     * Uninstalls plugins using npm.
     *
     * @param plugins - The plugins to uninstall.
     * @returns The execa result of the npm command.
     */
    uninstallPlugins(...plugins: string[]) {
        return this.npm('uninstall', ...plugins);
    }

    /**
     * Installs dependencies for the api using npm.
     *
     * @throws {Error} from execa if the npm install command fails.
     */
    async npmInstall(): Promise<void> {
        await this.npm('install');
    }

    /**
     * Rebuilds the vendored dependency archive for the api and stores it on the boot drive.
     * If the rc.unraid-api script is not found, an error is thrown.
     *
     * @throws {Error} from execa if the rc.unraid-api command fails.
     */
    async rebuildVendorArchive(): Promise<void> {
        const rcUnraidApi = '/etc/rc.d/rc.unraid-api';
        if (!(await fileExists(rcUnraidApi))) {
            throw new Error('[rebuild-vendor-archive] rc.unraid-api not found; no action taken!');
        }
        await execa(rcUnraidApi, ['archive-dependencies'], { stdio: 'inherit' });
    }
}
