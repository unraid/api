# Plugin Migration to Slackware Package: Progress Report

## Overview
This document tracks our progress in migrating the Unraid plugin to a native Slackware package.

## Completed Tasks

### Package Structure and Slackware Integration
- Created standard Slackware package description file (`slack-desc`) for the dynamix.unraid.net package
- Implemented proper Slackware init system integration:
  - Modified `rc.unraid-api` script to include standard start/stop/restart/status functions
  - Updated approach to use native Slackware init system rather than System V directories
  - Added boot-time node modules dependency restoration to the `start()` function
  - Moved environment setup from setup_api.sh to rc.unraid-api to ensure it's available at boot
  - The service will now properly start on boot if pre-installed in the OS

### Installation Scripts
- Added `doinst.sh` script to handle post-installation tasks like creating symlinks and starting services
- Implemented support for both install and remove operations in doinst.sh using Slackware's installation mode parameter
- Modularized the installation logic into separate scripts for better maintainability:
  - `setup_api.sh`: Handles API setup, symlinks, and service startup
  - `file_patches.sh`: Manages file patches and system configurations
  - `cleanup.sh`: Performs uninstallation and cleanup operations
- Improved doinst.sh script maintainability:
  - Added SCRIPTS_DIR variable to centralize script paths
  - Replaced all hardcoded script paths with the variable reference

### Cleanup and Removal Operations
- File restoration scripts have been successfully migrated from the plugin's inline code to the modular cleanup.sh script
- Enhanced cleanup.sh to handle both installation and removal scenarios with a mode parameter ('restore' or 'cleanup')
- Updated doinst.sh to call cleanup.sh with the appropriate mode for both installation and removal operations
- Simplified the plugin XML file by removing all cleanup code, as these operations are now entirely handled by the Slackware package system
- Updated the removal script to rely on the Slackware package system instead of manually running cleanup operations
- Consolidated all cleanup scripts into a single robust shell script:
  - Merged functionality from the PHP `cleanup_operations.php` script into the shell-based `cleanup.sh`
  - Removed dependency on PHP for cleanup operations, making it more compatible with native Slackware tooling
  - Created a unified script that handles both file restoration (during installation) and full cleanup (during removal)

### Node.js and Dependencies Management
- Removed Node.js symlinking from both the doinst.sh script and plugin file as this will be handled by the build-txz script
- Implemented vendor archive handling in the rc.unraid-api script:
  - Proper path definitions for the vendor archive
  - Comprehensive dependency restoration function that checks file existence and disk space
  - Archive creation function for backing up node_modules
  - Command-line interface for both restoration and archiving operations
  - Automatic restoration during service startup if node_modules are missing

### Script Consolidation
- Eliminated duplicate cleanup scripts by standardizing on the version at usr/local/share/dynamix.unraid.net/install/scripts/cleanup.sh
- Eliminated duplicate setup_api.sh scripts by standardizing on the version at usr/local/share/dynamix.unraid.net/install/scripts/setup_api.sh

### POSIX Compatibility
- Ensured POSIX shell compatibility by replacing Bash-specific array syntax with POSIX-compliant for loops
- Fixed POSIX shell compatibility in verify_install.sh:
  - Replaced Bash-specific array syntax with POSIX-compliant string lists
  - Maintained identical functionality while ensuring /bin/sh compatibility
  - Eliminated SC3030 shellcheck warnings about undefined arrays in POSIX sh
  - Removed unused check_file() function to fix SC2317 unreachable command warning

### Verification and TAG Handling
- Created post-installation verification script:
  - Checks for existence of critical files and directories
  - Verifies executable permissions on important scripts
  - Validates startup and shutdown configurations in rc.M, rc.local, rc.0, and rc.6 files
  - Provides color-coded output for easy readability
  - Integrated with doinst.sh to run automatically after installation
- Added TAG handling from plugin XML file to the Slackware package

### Slackware-Native Init System Changes
- Completely rewrote the startup/shutdown system to use Slackware's native approach:
  - Removed all code trying to create or use System V-style rc*.d directories
  - Implemented direct modification of rc.M and rc.local for service startup
  - Implemented direct modification of rc.0 and rc.6 for service shutdown
  - Created a generic `configure_script()` function to handle both startup and shutdown scripts
  - Updated verification script to check for the proper Slackware initialization entries
  - The setup_api.sh script now properly modifies rc.M, rc.local, rc.0, and rc.6 files

## Recent Decisions
- Kept version compatibility check in the plugin file rather than the Slackware package:
  - Recognized that doinst.sh runs after files are already installed
  - Version checking needs to happen before installation to be effective
  - The PHP check in the plugin file is the best place for this validation
- Removed TAG handling from doinst.sh and reverted to plugin file approach:
  - Discovered TAG isn't properly set in the Unraid environment within doinst.sh context
  - Reverted to using the plugin file for TAG handling to ensure proper functionality
- Identified issue with runlevel directory creation approach:
  - Discovered that in Slackware, the rc.0 and rc.6 files are actual files, not directories
  - Completely redesigned the approach to use Slackware's native init system
  - Now directly modifying rc.M and rc.local for startup, rc.0 and rc.6 for shutdown

## Removed Components
- Removed redundant build-slackware-package.sh script:
  - Eliminated duplicate functionality as we now use build-txz.ts for package creation
  - Simplified build tooling to use a single TypeScript-based build process
- Removed makepkg-usage.md documentation:
  - Determined that direct makepkg usage documentation is unnecessary
  - Package creation is now fully handled by the build-txz.ts script
- Removed System V-style init system code:
  - Eliminated all code related to rc*.d directories that don't exist in Slackware
  - Replaced with native Slackware init system modification approach

## Next Steps
- Document complete migration process with testing results
- Review and ensure all file permissions are set correctly
- Test package installation and removal
- Verify that all services start correctly after installation

## Implementation Notes
- Disk space verification checks are not needed in the native package since it will be pre-installed in Unraid
- Gzip availability checks are unnecessary for the native package
- DNS resolution checks are unnecessary and should be removed from the plugin file
- Plugin staging conflict check is outdated and no longer needed
- Full SlackBuild script is not necessary since we're not compiling code; direct use of `makepkg` is simpler
- Version compatibility checks should remain in the plugin file since they need to run before installation 

## Recent Improvements
- Enhanced Firefox configuration in file_patches.sh:
  - Replaced hardcoded Firefox profile path with dynamic profile detection
  - Added fallback handling when Firefox profile cannot be found
  - Improved user feedback with status messages about configuration changes
  - Made the script more resilient to Firefox profile directory changes in future Unraid versions
- Improved POSIX and shellcheck compliance in cleanup.sh:
  - Fixed SC2046 warning in process termination code by properly handling pidof with no results
  - Improved ps/grep/kill pattern to safely handle cases with no matching processes
  - Prevented non-zero exit codes during cleanup process to ensure smooth uninstallation
  - Enhanced reliability of the script in edge cases like when no processes are running
  - Fixed base64 encoding to prevent line wrapping in HTTP POST data by piping through tr -d '\n' 
- Enhanced POSIX compatibility in shell scripts:
  - Replaced echo statements with escape sequences (\n) with printf commands
  - Fixed issue where /bin/sh implementations (like dash) print literal \n instead of interpreting them
  - Improved formatting of status messages in cleanup.sh with proper newlines
  - Ensured better cross-platform compatibility across different shell implementations
- Created advanced init script configuration:
  - Implemented a unified script function that handles both startup and shutdown script modifications
  - Added intelligent handling of script placement (end of file for startup, beginning for shutdown)
  - Made the verification script more robust to check both potential startup locations (rc.M and rc.local)
  - Added conditional checks to only setup flash_backup if it exists

## Bug Fixes
- Fixed malformed sed pattern in cleanup.sh:
  - Changed `sed -i '#robots.txt any origin/d'` to use standard slash delimiters
  - Replaced with `sed -i '/#robots.txt any origin/d'` to correctly match and delete the pattern
  - This ensures the robots.txt origin line is properly removed from rc.nginx during cleanup 
- Fixed issue in rc6.d and rc0.d directory creation:
  - Previously attempted to create and use rc0.d/rc6.d directories that don't exist in Slackware
  - Completely rewrote the approach to directly modify rc.0 and rc.6 files
  - Now correctly configures shutdown using Slackware's native approach

## Changes Implemented

### rc.unraid-api Script
- Added functionality to start flash backup service during API service startup
- This ensures that flash backup is running whenever the API service is started

### setup_api.sh Script
- Completely redesigned to use Slackware's native initialization system
- Now properly configures both startup (in rc.M and rc.local) and shutdown (in rc.0 and rc.6)
- Created a unified `configure_script()` function that handles all script modifications
- Made startup/shutdown script handling more intelligent and robust

## API Setup Script Validation
- Identified issue with `setup_api.sh` not executing properly during package installation:
  - Despite being called correctly from `doinst.sh`, the script fails to create necessary symlinks
  - Manual execution of the script after installation was required to properly set up API
  - Key symptoms include missing symlinks that should have been created during installation
  - Further troubleshooting needed to determine why the script doesn't function when called by doinst.sh
  - Potential issues:
    - Path resolution differences when called from doinst.sh vs manual execution
    - Permission issues during package installation process
    - Environment variable differences between package install context and manual execution
  - Action item: Add logging to doinst.sh and setup_api.sh to debug execution flow during installation

## Pending Tasks
- Continue migrating plugin components to follow Slackware package standards
- Review and ensure all necessary init scripts are properly configured
- Test the startup and shutdown sequences for all services 