import { execSync } from 'child_process';
import { platform } from 'os';

console.log('Running build-native.js script...');

// Set up platform-specific environment variables
const env = { ...process.env };
const getPlatformPaths = () => {
  switch (platform()) {
    case 'darwin':
      return {
        LIBVIRT_INCLUDE_DIR: process.env.LIBVIRT_INCLUDE_DIR || '/opt/homebrew/include',
        LIBVIRT_LIB_DIR: process.env.LIBVIRT_LIB_DIR || '/opt/homebrew/lib'
      };
    case 'linux':
      return {
        LIBVIRT_INCLUDE_DIR: process.env.LIBVIRT_INCLUDE_DIR || '/usr/include',
        LIBVIRT_LIB_DIR: process.env.LIBVIRT_LIB_DIR || '/usr/lib'
      };
    default:
      throw new Error(`Unsupported platform: ${platform()}`);
  }
};

Object.assign(env, getPlatformPaths());

// Run node-gyp rebuild with the appropriate environment
execSync('pnpm exec node-gyp rebuild', { env, stdio: 'inherit' });