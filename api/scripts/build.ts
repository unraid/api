#!/usr/bin/env zx
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { exit } from 'process';

import { $, cd } from 'zx';

import { getDeploymentVersion } from './get-deployment-version.js';

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
    const parsedPackageJson = JSON.parse(packageJson);

    const deploymentVersion = await getDeploymentVersion(process.env, parsedPackageJson.version);

    // Update the package.json version to the deployment version
    parsedPackageJson.version = deploymentVersion;

    // Create a temporary directory for packaging
    await mkdir('./deploy/pack/', { recursive: true });

    await writeFile('./deploy/pack/package.json', JSON.stringify(parsedPackageJson, null, 4));
    // Copy necessary files to the pack directory
    await $`cp -r dist README.md .env.* ecosystem.config.json ./deploy/pack/`;
    await $`cp ./.npmrc-for-release-build ./deploy/pack/.npmrc`;

    // Change to the pack directory and install dependencies
    cd('./deploy/pack');

    console.log('Building production pnpm store...');
    $.verbose = true;
    await $`pnpm config get store-dir`;
    await $`pnpm install --prod --ignore-workspace`;

    await $`rm -rf node_modules`; // Don't include node_modules in final package
    await $`XZ_OPT=-5 tar -cJf ../packed-pnpm-store.txz ../.pnpm-store`;

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
