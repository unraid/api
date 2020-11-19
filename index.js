// If this isn't installed we'll just ignore it
try {
    // Load source maps
    require('source-map-support').install({
        handleUncaughtExceptions: false
    });
} catch {}

// Ensure we're in the right starting directory
process.chdir(__dirname);

// Load process
require('./dist/index');

if (process.env.NO_DAEMON || !process.env.DEBUG) {
    // Convert process into daemon
    require('daemonize-process')();
}