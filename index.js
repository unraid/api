// @ts-check
const os = require('os');
const path = require('path');
const Sentry = require('@sentry/node');
const package = require('./package.json');
const { main } = package;

// Send errors to server if enabled
Sentry.init({
	dsn: process.env.SENTRY_DSN,
	tracesSampleRate: 1.0,
	release: require('./package.json').version,
	environment: process.env.NODE_ENV,
	serverName: os.hostname(),
	enabled: Boolean(process.env.SENTRY_DSN)
});

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

try {
    const mainPath = path.resolve(__dirname, main);
    require(mainPath);
} catch (error) {
    Sentry.captureException(error);
    console.error(error.message);
    process.exit(1);
}