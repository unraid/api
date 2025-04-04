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
    const rootPackageJson = await readFile('./../package.json', 'utf-8');
    const parsedRootPackageJson = JSON.parse(rootPackageJson);

    const deploymentVersion = await getDeploymentVersion(process.env, parsedPackageJson.version);

    // Update the package.json version to the deployment version
    parsedPackageJson.version = deploymentVersion;
    // omit dev dependencies from release build
    parsedPackageJson.devDependencies = {};

    // add all PNPM settings for pnpm install from root package.json
    parsedPackageJson.pnpm = parsedRootPackageJson.pnpm;

    // Create a temporary directory for packaging
    await mkdir('./deploy/pack/', { recursive: true });

    await writeFile('./deploy/pack/package.json', JSON.stringify(parsedPackageJson, null, 4));
    // Copy necessary files to the pack directory
    await $`cp -r dist README.md .env.* ecosystem.config.json ./deploy/pack/`;

    // Change to the pack directory and install dependencies
    cd('./deploy/pack');

    console.log('Building production pnpm store...');
    $.verbose = true;
    await $`pnpm install --prod --ignore-workspace --store-dir=../.pnpm-store`;

    // Now remove the onlybuilddependencies from the package json
    delete parsedPackageJson.pnpm;
    // Now write the package.json back to the pack directoryaw
    await writeFile('package.json', JSON.stringify(parsedPackageJson, null, 4));

    await $`rm -rf node_modules`; // Don't include node_modules in final package

    const sudoCheck = await $`command -v sudo`.nothrow();
    const SUDO = sudoCheck.exitCode === 0 ? 'sudo' : '';
    await $`${SUDO} chown -R 0:0 ../.pnpm-store`;

    await $`XZ_OPT=-5 tar -cJf ../packed-pnpm-store.txz ../.pnpm-store`;
    await $`${SUDO} rm -rf ../.pnpm-store`;

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
