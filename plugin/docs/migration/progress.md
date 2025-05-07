# Migration Progress: Plugin to Slackware Package

## Completed Tasks

### 2024-05-XX

- Modified `setup_api.sh` to only use the Slackware package version
  - Removed all fallback logic for bundle detection
  - Now exclusively uses version from dynamix.unraid.net Slackware package
  - Exit with error if package not found instead of falling back to defaults
  - Simplified logic for finding and using the correct bundle archives
  - Fixed ShellCheck SC2010 violations by replacing `ls | grep` with proper glob pattern matching
- Added missing `api_version` entity to the plugin XML definition to fix build errors

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