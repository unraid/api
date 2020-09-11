// @ts-check
const path = require('path');
const package = require('./package.json');
const { main } = package;

const log = process.env.NODE_ENV === 'production' ? {
    info() { },
    log() { },
    debug() { },
    error() { }
} : console;

if (!main) {
    log.error('<worker> Missing main field in package.json');
    process.exit(1);
}

const mainPath = path.resolve(__dirname, main);

// Show real stack trace in development
if (process.env.NODE_ENV === 'development') {
    try {
        require('source-map-support').install({
            handleUncaughtExceptions: false
        });
    } catch {
        log.error(`Could not load "source-map-support", do you have it installed?`);
    }
}

if (!process.env.CLUSTER) {
    require(mainPath);
} else {
    require('./cluster');
}