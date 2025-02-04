#!/usr/bin/env zx
import { cp, mkdir, writeFile } from 'fs/promises';
import { exit } from 'process';

import { $, cd } from 'zx';

import { getDeploymentVersion } from './get-deployment-version.mjs';

try {
    
    // Enable colours in output
    process.env.FORCE_COLOR = '1';

    // Ensure we have the correct working directory
    process.env.WORKDIR ??= process.env.PWD;
    cd(process.env.WORKDIR);

    await $`rm -rf ./deploy/*`;
    // Create deployment directories - ignore if they already exist
    await mkdir('./deploy/release', { recursive: true });
    await mkdir('./deploy/pre-pack', { recursive: true });

    // Build Generated Types
    await $`npm run codegen`;

    await $`npm run build`;
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
    const { name, version, ...rest } = await import('../package.json', {
        assert: { type: 'json' },
    }).then((pkg) => pkg.default);

    const deploymentVersion = getDeploymentVersion(process.env, version);

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

    await cp('./node_modules', './deploy/pre-pack/node_modules', { recursive: true });
    // Install production dependencies

    console.log('Installing dependencies...');

    $.verbose = true;
    await $`npm --prefix ./deploy/pre-pack prune --omit=dev`;
    await $`npm --prefix ./deploy/pre-pack install --omit=dev`;

    // Ensure that we don't have any dev dependencies left
    console.log('Installed dependencies:');
    await $`npm --prefix ./deploy/pre-pack ls --omit=dev --depth=0`;

    console.log('Dependencies installed, packing...');

    // Now we'll pack everything in the pre-pack directory to the release directory
    await $`tar -czf ./deploy/release/unraid-api-${deploymentVersion}.tgz ./deploy/pre-pack/`;
    console.log('Packing complete, build finished.');
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
