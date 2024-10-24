#!/usr/bin/env zx
import { exit } from 'process';
import { cd, $ } from 'zx';

import { getDeploymentVersion } from './get-deployment-version.mjs';

try {
    // Enable colours in output
    process.env.FORCE_COLOR = '1';

    // Ensure we have the correct working directory
    process.env.WORKDIR = process.env.WORKDIR ?? process.env.PWD;
    cd(process.env.WORKDIR);

    // Create deployment directories - ignore if they already exist
    await $`mkdir -p ./deploy/release`;
    await $`mkdir -p ./deploy/pre-pack`;

    await $`rm -rf ./deploy/release/*`;
    await $`rm -rf ./deploy/pre-pack/*`;

    // Build Generated Types
    await $`npm run codegen`;

    // Copy app files to plugin directory
    await $`cp -r ./src/ ./deploy/pre-pack/src/`;

    // Copy environment to deployment directory
    await $`cp ./.env.production ./deploy/pre-pack/.env.production`;
    await $`cp ./.env.staging ./deploy/pre-pack/.env.staging`;
    await $`cp ./tsconfig.json ./deploy/pre-pack/tsconfig.json`;
    await $`cp ./unraid-api.js ./deploy/pre-pack/unraid-api.js`;
    await $`cp ./codegen.yml ./deploy/pre-pack/codegen.yml`;
    await $`cp ./ecosystem.config.json ./deploy/pre-pack/ecosystem.config.json`;

    // Get package details
    const { name, version, ...rest } = await import('../package.json', {
        assert: { type: 'json' },
    }).then((pkg) => pkg.default);

    const deploymentVersion = getDeploymentVersion(process.env, version);

    // Create deployment package.json
    await $`echo ${JSON.stringify({
        ...rest,
        name,
        version: deploymentVersion,
    })} > ./deploy/pre-pack/package.json`;

    // # Create final tgz
    await $`cp ./README.md ./deploy/pre-pack/`;

    await $`cp -r ./node_modules ./deploy/pre-pack/node_modules`;
	// Install production dependencies
    cd('./deploy/pre-pack');

    await $`npm prune --omit=dev`;
    await $`npm install --omit=dev`;

    // Now we'll pack everything in the pre-pack directory
    await $`tar -czf ../unraid-api-${deploymentVersion}.tgz .`;

    // Move unraid-api.tgz to release directory
    await $`mv ../unraid-api-${deploymentVersion}.tgz ../release`;
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
