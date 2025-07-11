#!/usr/bin/env zx
import { mkdir, readFile, writeFile } from 'fs/promises';
import { existsSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { exit } from 'process';

import type { PackageJson } from 'type-fest';
import { $, cd } from 'zx';

import { getDeploymentVersion } from './get-deployment-version.js';

type ApiPackageJson = PackageJson & {
    version: string;
    peerDependencies: Record<string, string>;
    dependencies?: Record<string, string>;
};

/**
 * Map of workspace packages to vendor into production builds.
 * Key: package name, Value: path from monorepo root to the package directory
 */
const WORKSPACE_PACKAGES_TO_VENDOR = {
    '@unraid/shared': 'packages/unraid-shared',
    'unraid-api-plugin-connect': 'packages/unraid-api-plugin-connect',
} as const;

/**
 * Packs a workspace package and installs it as a tarball dependency.
 */
const packAndInstallWorkspacePackage = async (pkgName: string, pkgPath: string, tempDir: string) => {
    const [fullPkgPath, fullTempDir] = [resolve(pkgPath), resolve(tempDir)];
    if (!existsSync(fullPkgPath)) {
        console.warn(`Workspace package ${pkgName} not found at ${fullPkgPath}. Skipping.`);
        return;
    }
    console.log(`Building and packing workspace package ${pkgName}...`);
    // Pack the package to a tarball
    const packedResult = await $`pnpm --filter ${pkgName} pack --pack-destination ${fullTempDir}`;
    const tarballPath = packedResult.lines().at(-1)!;
    const tarballName = basename(tarballPath);

    // Install the tarball
    const tarballPattern = join(fullTempDir, tarballName);
    await $`npm install ${tarballPattern}`;
};

/**------------------------------------------------------------------------
 *                             Build Script
 *
 * Builds & vendors the API for deployment to an Unraid server.
 *
 * Places artifacts in the `deploy/` folder:
 * - release/ contains source code & assets
 * - node-modules-archive/ contains tarball of node_modules
 *------------------------------------------------------------------------**/

try {
    // Create release and pack directories
    await mkdir('./deploy/release', { recursive: true });
    await mkdir('./deploy/pack', { recursive: true });

    // Build Generated Types
    await $`pnpm run codegen`;

    await $`pnpm run build`;
    // Copy app files to plugin directory

    // Get package details
    const packageJson = await readFile('./package.json', 'utf-8');
    const parsedPackageJson = JSON.parse(packageJson) as ApiPackageJson;
    const deploymentVersion = await getDeploymentVersion(process.env, parsedPackageJson.version);

    // Update the package.json version to the deployment version
    parsedPackageJson.version = deploymentVersion;

    /**---------------------------------------------
     * Handle workspace runtime dependencies
     *--------------------------------------------*/
    const workspaceDeps = Object.keys(WORKSPACE_PACKAGES_TO_VENDOR);
    if (workspaceDeps.length > 0) {
        console.log(`Stripping workspace deps from package.json: ${workspaceDeps.join(', ')}`);
        workspaceDeps.forEach((dep) => {
            if (parsedPackageJson.dependencies?.[dep]) {
                delete parsedPackageJson.dependencies[dep];
            }
        });
    }

    // omit dev dependencies from vendored dependencies in release build
    parsedPackageJson.devDependencies = {};

    // Create a temporary directory for packaging
    await mkdir('./deploy/pack/', { recursive: true });

    await writeFile('./deploy/pack/package.json', JSON.stringify(parsedPackageJson, null, 4));
    // Copy necessary files to the pack directory
    await $`cp -r dist README.md .env.* ecosystem.config.json ./deploy/pack/`;

    // Change to the pack directory and install dependencies
    cd('./deploy/pack');

    console.log('Building production node_modules...');
    $.verbose = true;
    await $`npm install --omit=dev`;

    await writeFile('package.json', JSON.stringify(parsedPackageJson, null, 4));

    /** After npm install, vendor workspace packages via pack/install */
    if (workspaceDeps.length > 0) {
        console.log('Vendoring workspace packages...');
        const tempDir = './packages';
        await mkdir(tempDir, { recursive: true });

        for (const dep of workspaceDeps) {
            const pkgPath =
                WORKSPACE_PACKAGES_TO_VENDOR[dep as keyof typeof WORKSPACE_PACKAGES_TO_VENDOR];
            // The extra '../../../' prefix adjusts for the fact that we're in the pack directory.
            // this way, pkgPath can be defined relative to the monorepo root.
            await packAndInstallWorkspacePackage(dep, join('../../../', pkgPath), tempDir);
        }
    }

    // Clean the release directory
    await $`rm -rf ../release/*`;

    // Copy other files to release directory
    await $`cp -r ./* ../release/`;

    // chmod the cli
    await $`chmod +x ./dist/cli.js`;
    await $`chmod +x ./dist/main.js`;
} catch (error) {
    // Error with a command
    if (Object.keys(error).includes('stderr')) {
        console.log(`Failed building package. Exit code: ${error.exitCode}`);
        console.log(`Error: ${error.stderr}`);
    } else {
        // Normal js error
        console.log('Failed building package.');
        console.log(`Error: ${error.message}`);
    }

    exit(error.exitCode);
}
