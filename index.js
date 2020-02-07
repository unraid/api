const path = require('path');
const cluster = require('cluster');

const log = process.env.NODE_ENV === 'production' ? {
    info() { },
    log() { },
    debug() { },
    error() { }
} : console;

// Set current working directory
process.chdir(__dirname);

const RESTART_ATTEMPTS = 10;
let currentRestartAttempt = 0;
let currentWorker;

// Master
if (cluster.isMaster) {
    // Set process name so we can easily find it
    process.title = 'gql-supervisor';

    // Show real stack trace in development
    if (process.env.NODE_ENV === 'development') {
        try {
            require('source-map-support').install({
                handleUncaughtExceptions: false
            });
        } catch {
            log.error(`Could not load "source-map-supoort", do you have it installed?`);
        }
    }

    log.info(`<master> pid = ${process.pid}`);
    currentWorker = cluster.fork();

    cluster.on('exit', (_, code) => {
        if (code === null || code === 0) {
            const newWorker = cluster.fork();
            newWorker.once('online', () => {
                currentWorker = newWorker;
            });
            return;
        }

        if (code !== 7) {
            process.exit(code);
        }

        if (currentRestartAttempt >= RESTART_ATTEMPTS) {
            log.debug(`No restart attempts left. Exiting.`);
            process.exit(1);
        }

        currentRestartAttempt++;
        currentWorker = cluster.fork();
    });

    // Allow reload on SIGHUP
    process.on('SIGHUP', () => {
        log.debug('<master> Reloading worker');
        currentWorker.send('shutdown');
    });
}

// Worker
if (cluster.isWorker) {
    log.info(`<worker> pid = ${process.pid}`);

    // @ts-ignore
    const package = require('./package.json');
    const { main } = package;

    if (!main) {
        log.error('<worker> Missing main field in package.json');
        process.exit(1);
    }

    const mainPath = path.resolve(__dirname, main);

    try {
        log.info('<worker> loaded');
        require(mainPath);
    } catch (error) {
        log.error(error);
        log.error(`<worker> Could not load main field "${mainPath}".`);
        process.exit(1);
    }
}
