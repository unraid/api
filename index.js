// If this isn't installed we'll just ignore it
try {
    require('source-map-support').install({
        handleUncaughtExceptions: false
    });
} catch {}

process.chdir(__dirname);
require('./dist/index');