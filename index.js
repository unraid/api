// @ts-check
const path = require('path');
const package = require('./package.json');
const { main } = package;

if (!main) {
    throw new Error('Missing main field in package.json');
}

// Show real stack trace in development
if (process.env.NODE_ENV === 'development') {
    try {
        require('source-map-support').install({
            handleUncaughtExceptions: false
        });
    } catch {
        console.error(`Could not load "source-map-support", do you have it installed?`);
    }
}


const mainPath = path.resolve(__dirname, main);
require(mainPath);