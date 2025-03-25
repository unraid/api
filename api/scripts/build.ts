#!/usr/bin/env zx
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { exit } from 'process';

import { $, cd } from 'zx';

import { getDeploymentVersion } from './get-deployment-version.js';
import { join } from 'path';

const workingDir = join(import.meta.dirname, '..');
console.log('Working directory:', workingDir);
try {
    // Create release and pack directories
    await mkdir(join(workingDir, 'deploy/release'), { recursive: true });
    await mkdir(join(workingDir, 'deploy/pack/api'), { recursive: true });
    await mkdir(join(workingDir, 'deploy/pack/connect'), { recursive: true });

    // Build Generated Types
    await $`pnpm run codegen`;

    await $`pnpm run build:api`;
    await $`pnpm run build:connect`;
    // Copy app files to plugin directory

    // Get package details
    const packageJson = await readFile(join(workingDir, 'package.json'), 'utf-8');
    const parsedPackageJson = JSON.parse(packageJson);

    const deploymentVersion = await getDeploymentVersion(process.env, parsedPackageJson.version);

    // Update the package.json version to the deployment version
    parsedPackageJson.version = deploymentVersion;

    await writeFile(join(workingDir, 'deploy/pack/api/package.json'), JSON.stringify(parsedPackageJson, null, 4));
    await writeFile(join(workingDir, 'deploy/pack/connect/package.json'), JSON.stringify(parsedPackageJson, null, 4));

    // Copy necessary files to the pack directory
    await $`cp -r dist/api/ README.md .env.* ecosystem.config.json ./deploy/pack/api/`;
    await $`cp -r dist/connect/ README.md .env.* ecosystem.config.json ./deploy/pack/connect/`;

    // Change to the pack directory and install dependencies
    cd(join(workingDir, 'deploy/pack/connect'));

    console.log('Installing production dependencies...');
    $.verbose = true;
    await $`pnpm install --prod --ignore-workspace --node-linker hoisted`;
    await $`pnpm approve-builds --all`;

    cd(join(workingDir, 'deploy/pack/api'));
    await $`cp -r ../connect/node_modules ./node_modules`;

    // chmod the cli
    await $`chmod +x ${join(workingDir, 'deploy/pack/api/cli.js')} \
    ${join(workingDir, 'deploy/pack/api/main.js')} \
    ${join(workingDir, 'deploy/pack/connect/cli.js')} \
    ${join(workingDir, 'deploy/pack/connect/main.js')}`;

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
