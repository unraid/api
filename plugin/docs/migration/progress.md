# Migration Progress: Plugin to Slackware Package

## Completed Tasks

### 2024-05-XX

- Normalized entity name casing in plugin XML and build scripts
  - Changed uppercase entity names to lowercase for consistency (TXZ_SHA256 → txz_sha256, MAIN_TXZ → main_txz, etc.)
  - Renamed pluginURL to plugin_url for consistent naming pattern
  - Changed TAG to lowercase (tag)
  - Updated build-plugin.ts to match the normalized casing in the plugin XML
  - Ensures consistent naming convention across the codebase

- Modified `setup_api.sh` to only use the Slackware package version
  - Removed all fallback logic for bundle detection
  - Now exclusively uses version from dynamix.unraid.net Slackware package
  - Exit with error if package not found instead of falling back to defaults
  - Simplified logic for finding and using the correct bundle archives
  - Fixed ShellCheck SC2010 violations by replacing `ls | grep` with proper glob pattern matching
- Added missing `api_version` entity to the plugin XML definition to fix build errors
- Fixed shell escaping issue in `file_patches.sh`:
  - Corrected the sed command to properly preserve escape sequences using printf
  - Ensures idempotent insertion of nginx configuration changes
- Added fallback for missing .env.production file in setup_api.sh
  - Creates a default .env file with NODE_ENV=production when .env.production is missing
  - Ensures the API can start even if the production environment file is not available
- Documented API package.json build process for Slackware packaging
  - The API package needs to be built with `pnpm build` in the `/api` directory
  - This generates the required package.json needed by the build-txz.ts process
  - The build process runs Vite in production mode and copies necessary plugin files
- Cleaned up plugin XML file to remove unused variables:
  - Removed Node.js runtime variables (NODEJS_VERSION, NODEJS_FILENAME, NODE_DIR)
  - Kept only essential entities needed for downloads and Slackware package installation
  - Streamlined plugin installation to rely more on Slackware package mechanisms

## Pending Tasks

- Update installation process to use native Slackware packaging
- Modify build scripts to create proper Slackware packages
- Update boot scripts to conform with Slackware standards
- Test package installation/upgrade flows
- Implement proper package dependencies
- Ensure all scripts use proper Slackware paths and conventions

## In Progress

1. Refactoring `build-plugin.ts` to better support Slackware package format.
2. Implementing standard Slackware package scripts (doinst.sh, etc.)

## Next Steps

1. Create standard Slackware package structure
   - Create install directory with doinst.sh script
   - Setup proper Slackware package metadata

2. Utilize native Slackware tooling for:
   - Package installation
   - Service management
   - Version tracking

3. Update vendor storage mechanism to align with Slackware standards

## References

- The setup_api.sh script (at plugin/source/dynamix.unraid.net/usr/local/share/dynamix.unraid.net/install/scripts/) already implements some Slackware-style package detection for getting API version. 

# Building the API Package

## API Build Process

1. Navigate to the API directory:
   ```bash
   cd /path/to/api/api
   ```

2. Build the API package with production settings:
   ```bash
   pnpm build
   ```

3. What this does:
   - Runs Vite build in production mode (`vite build --mode=production`)
   - Executes post-build script that:
     - Makes the main.js and cli.js files executable
     - Copies required plugin files
   - Generates necessary files in the `api/dist` directory
   - Creates the package.json file required by the build-txz.ts process

4. Validation:
   - The build-txz.ts process checks for the existence of package.json in the API directory
   - If missing, it throws an error: "API package.json file ${packageJson} does not exist"

## Required Components for the Slackware Package

1. API Distribution Files:
   - Located in `api/dist/` after building
   - Include executable JavaScript files and plugin assets

2. UI Components:
   - Web manifest.json - built with `pnpm build` in the web directory
   - UI manifest.json - built with `pnpm build:wc` in the unraid-ui directory

3. Slackware Package Structure:
   - Will be assembled during the txz build process
   - Requires proper doinst.sh and other Slackware package scripts

# Plugin Migration to Slackware Package

## Progress

- Updated the build-txz.ts error message to provide the correct build commands for manifest files:
  - `ui.manifest.json` is built with `pnpm build:wc` in the unraid-ui directory
  - `manifest.json` is built with `pnpm build` in the web directory
- Analyzed Node.js installation requirements:
  - The Node.js include files (headers) are not required for runtime operation on Unraid
  - Only the Node.js binary and runtime libraries are needed for the API service to run
  - Files to exclude from the Slackware package to reduce size:
    - `usr/local/include/node` - header files only needed for building native addon modules
    - `usr/local/share/doc/node` - documentation files not needed for runtime
    - Root documentation files (README.md, LICENSE, CHANGELOG.md)

## Next Steps

- Continue implementing native Slackware tooling
- Ensure proper `doinst.sh` scripts are in place
- Complete migration of plugin functionality to Slackware package format