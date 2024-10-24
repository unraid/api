#!/usr/bin/env zx
import { exit } from 'process';
import { cd, $ } from 'zx';

import getTags from './get-tags.mjs';

try {
    // Enable colours in output
    process.env.FORCE_COLOR = '1';

    // Ensure we have the correct working directory
    process.env.WORKDIR = process.env.WORKDIR ?? process.env.PWD;
    cd(process.env.WORKDIR);

    // Create deployment directories - ignore if they already exist
    await $`mkdir -p ./deploy/release`;
    await $`mkdir -p ./deploy/pre-pack`;

    await $`rm -r ./deploy/release/*`;
    await $`rm -r ./deploy/pre-pack/*`;

	await $`npm install -g npm-pack-all`;

    // Ensure all deps are installed
    await $`npm i`;

    // Build Generated Types
    await $`npm run codegen`;

    // Copy app files to plugin directory
    await $`cp -r ./src/ ./deploy/pre-pack/src/`;

    // Copy environment to deployment directory
    await $`cp ./.env.production ./deploy/pre-pack/.env.production`;
    await $`cp ./.env.staging ./deploy/pre-pack/.env.staging`;

    // Get package details
    const { name, version, ...rest } = await import('../package.json', {
        assert: { type: 'json' },
    }).then((pkg) => pkg.default);

    const tags = getTags(process.env);

    // Decide whether to use full version or just tag
    const isTaggedRelease = tags.isTagged;
    const gitShaShort = tags.shortSha;

    const deploymentVersion = isTaggedRelease ? version : `${version}+${gitShaShort}`;

    // Create deployment package.json
    await $`echo ${JSON.stringify({
        name,
        version: deploymentVersion,
        ...rest,
    })} > ./deploy/pre-pack/package.json`;

    // # Create final tgz
    await $`cp ./README.md ./deploy/pre-pack/`;
    cd('./deploy/pre-pack');

	// Install production dependencies
	await $`npm i --omit=dev`;
    await $`npm-pack-all`;

    // Move unraid-api.tgz to release directory
    await $`mv unraid-api-${deploymentVersion}.tgz ../release`;

    // Set API_VERSION output based on this command
    await $`echo "::set-output name=API_VERSION::${deploymentVersion}"`;
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
