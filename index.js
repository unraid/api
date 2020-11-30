const tryRequire = (name, onFail) => {
    try {
        return require(name);
    } catch {
        onFail();
    }
};

// Load source maps
const sourceMaps = tryRequire('source-map-support');
if (sourceMaps) {
    sourceMaps.install({
        handleUncaughtExceptions: false
    });
}

// Ensure we're in the right starting directory
process.chdir(__dirname);

// Load .env file
require('dotenv').config();

// Load process
require('./dist/index', () => {
    // Failed to load main file
    process.exit(1);
});

if (process.env.NO_DAEMON || !process.env.DEBUG) {
    // Convert process into daemon
    require('daemonize-process')();
}