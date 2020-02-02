const path = require('path');
const cluster = require('cluster');

// Show real stack trace in development
if (process.env.NODE_ENV === 'development') {
    try {
        require('source-map-support').install({
            handleUncaughtExceptions: false
        });
    } catch {
        console.error(`Could not load "source-map-supoort", do you have it installed?`);
    }
}

// Set current working directory
process.chdir(__dirname);

const RESTART_ATTEMPTS = 10;
let currentRestartAttempt = 0;

if (cluster.isMaster) {
    cluster.fork();

    cluster.on('exit', (_, code) => {
        if (code !== 7) {
            process.exit(code);
        }

        if (currentRestartAttempt >= RESTART_ATTEMPTS) {
            console.debug(`No restart attempts left. Exiting.`);
            process.exit(1);
        }

        currentRestartAttempt++;
        cluster.fork();
    });
}

if (cluster.isWorker) {
    // @ts-ignore
    const package = require('./package.json');
    const { main } = package;

    if (!main) {
        console.error('Missing main field in package.json');
        process.exit(1);
    }

    const mainPath = path.resolve(__dirname, main);

    try {
        require(mainPath);
    } catch (error) {
        console.error(error);
        console.error(`Could not load main field "${mainPath}".`);
        process.exit(1);
    }
}