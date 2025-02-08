#!/usr/bin/env zx
import { cp, mkdir, readFile, writeFile } from 'fs/promises';
import { exit } from 'process';

import { $, cd } from 'zx';

import { getDeploymentVersion } from './get-deployment-version.js';

const callerDir = process.cwd();
console.log('Caller directory:', callerDir);

try {
    // Set working directory to caller location
    cd(callerDir);

    await $`echo ${callerDir}`;


    await $`rm -rf ./deploy/pre-pack/*`;
    // Create deployment directories - ignore if they already exist
    await mkdir('./deploy/pre-pack', { recursive: true });

    // Build Generated Types
    await $`pnpm run codegen`;

    await $`pnpm run build`;
    // Copy app files to plugin directory
    await cp('./dist', './deploy/pre-pack/dist', { recursive: true });

    // Copy environment to deployment directory
    const files = [
        '.env.production',
        '.env.staging',
        'tsconfig.json',
        'codegen.ts',
        'ecosystem.config.json',
        'vite.config.ts',
    ];

    for (const file of files) {
        await cp(`./${file}`, `./deploy/pre-pack/${file}`);
    }

    // Get package details
    const packageJson = await readFile('./package.json', 'utf-8');
    const { name, version, devDependencies, ...rest } = JSON.parse(packageJson);

    const deploymentVersion = await getDeploymentVersion(process.env, version);

    // Create deployment package.json
    await writeFile(
        './deploy/pre-pack/package.json',
        JSON.stringify(
            {
                name,
                version: deploymentVersion,
                ...rest,
            },
            null,
            2
        )
    );
    // # Create final tgz
    await cp('./README.md', './deploy/pre-pack/README.md');
    // Install production dependencies

    console.log('Installing dependencies...');

    $.verbose = true;

    await cd('./deploy/pre-pack');

    await $`pnpm install --prod`;

    // Ensure that we don't have any dev dependencies left
    console.log('Installed dependencies:');
    await $`pnpm ls --depth=0`;
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
