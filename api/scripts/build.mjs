#!/usr/bin/env zx
import { exit } from 'process';
import 'zx/globals';

try {
  // Enable colours in output
  process.env.FORCE_COLOR='1'

  // Ensure we have the correct working directory
  process.env.WORKDIR = process.env.WORKDIR ?? process.env.PWD;
  cd(process.env.WORKDIR);

  // Clean up last deploy
  await $`rm -rf ./deploy/release`;
  await $`rm -rf ./deploy/pre-pack`;
  await $`mkdir -p ./deploy/release/`;
  await $`mkdir -p ./deploy/pre-pack/`;

  // Build binary
  await $`npm run build`;

  // Copy binary + extra files to deployment directory
  await $`cp ./dist/api ./deploy/pre-pack/unraid-api`;
  await $`cp ./.env.production ./deploy/pre-pack/.env.production`;
  await $`cp ./.env.staging ./deploy/pre-pack/.env.staging`;

  // Get package details
  const { name, version } = await import('../package.json', {
    assert: { type: 'json' }
  }).then(pkg => pkg.default);

  // Decide whether to use full version or just tag
  const isTaggedRelease = await $`git describe --tags --abbrev=0 --exact-match`.then(() => true).catch(() => false);
  const gitShaShort = await $`git rev-parse --short HEAD`.then(({ stdout }) => stdout.trim());
  const deploymentVersion = isTaggedRelease ? version : `${version}+${gitShaShort}`;

  // Create deployment package.json
  await $`echo ${JSON.stringify({ name, version: deploymentVersion })} > ./deploy/pre-pack/package.json`;

  // # Create final tgz
  await $`cp ./README.md ./deploy/pre-pack/`;
  cd(`./deploy/pre-pack`);
  await $`npm pack`;

  // Move unraid-api.tgz to release directory
  await $`mv unraid-api-${deploymentVersion}.tgz ../release`;
} catch (error) {
  // Error with a command
  if (Object.keys(error).includes('stderr')) {
    console.log(`Failed building package. Exit code: ${error.exitCode}`);
    console.log(`Error: ${error.stderr}`);  
  } else {
    // Normal js error
    console.log(`Failed building package.`);
    console.log(`Error: ${error.message}`);
  }
  exit(error.exitCode);
}