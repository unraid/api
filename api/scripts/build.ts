#!/usr/bin/env zx
import { mkdir, readFile, writeFile } from 'fs/promises';
import { exit } from 'process';

import type { PackageJson } from 'type-fest';
import { $, cd } from 'zx';

import { getDeploymentVersion } from '@app/../scripts/get-deployment-version.js';

type ApiPackageJson = PackageJson & {
    version: string;
    peerDependencies: Record<string, string>;
};

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

    const compressionLevel = process.env.WATCH_MODE ? '-1' : '-5';
    await $`XZ_OPT=${compressionLevel} tar -cJf packed-node-modules.tar.xz node_modules`;
    // Create a subdirectory for the node modules archive
    await mkdir('../node-modules-archive', { recursive: true });
    await $`mv packed-node-modules.tar.xz ../node-modules-archive/`;
    await $`rm -rf node_modules`;

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
