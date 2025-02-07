#!/usr/bin/env zx
import { cp, mkdir, stat, writeFile } from 'fs/promises';
import { exit } from 'process';

import { pathExists } from 'fs-extra';
import { $, cd } from 'zx';

import { getDeploymentVersion } from './get-deployment-version.mjs';

try {
    // Enable colours in output
    process.env.FORCE_COLOR = '1';

    // Ensure we have the correct working directory
    process.env.WORKDIR ??= process.env.PWD;
    cd(process.env.WORKDIR);

    await $`rm -rf ./deploy/release/*`;
    await $`rm -rf ./deploy/pre-pack/*`;
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
    const { name, version, devDependencies, ...rest } = await import('../package.json', {
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
    // Install production dependencies

    console.log('Installing dependencies...');

    $.verbose = true;

    await cd('./deploy/pre-pack');

    await $`npm install --omit=dev --no-bin-links`;

    // Ensure that we don't have any dev dependencies left
    console.log('Installed dependencies:');
    await $`npm ls --depth=0`;

    console.log('Dependencies installed, packing...');

    // Now we'll pack everything in the pre-pack directory to the release directory
    const tarballPath = `../release/unraid-api-${deploymentVersion}.tgz`;
    await $`tar -czf ${tarballPath} .`;
    // Ensure the tarball exists
    if (!(await pathExists(tarballPath))) {
        console.error(`Failed to create tarball at ${tarballPath}`);
        process.exit(1);
    }
    const packageSize = Math.round((await stat(tarballPath)).size / 1024 / 1024);
    console.log(`Package created at: ${tarballPath} with size ${packageSize} MB`);
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
