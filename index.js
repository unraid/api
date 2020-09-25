// If this isn't installed we'll just ignore it
try {
    require('source-map-support').install({
        handleUncaughtExceptions: false
    });
} catch {}

require('./dist/index');