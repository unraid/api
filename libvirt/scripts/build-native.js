const { spawnSync } = require('child_process');
const { platform } = require('os');

console.log('Running build-native.js script...');

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    shell: true,
    ...options,
  });

  if (result.status !== 0) {
    console.error(`Command failed: ${command} ${args.join(' ')}`);
    process.exit(1);
  }

  return result;
}

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
runCommand('pnpm', ['exec', 'node-gyp', 'rebuild'], { env }); 