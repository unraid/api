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
let restart = true;

// @see https://github.com/nodejs/node-v0.x-archive/blob/master/doc/api/process.markdown#exit-codes
const onWorkerExit = (_, code) => {
    if (!restart) {
        process.exit(0);
    }

    // Reload worker
    if (code === null || code === 0) {
        const newWorker = cluster.fork();
        newWorker.once('online', () => {
            currentRestartAttempt = 0;
            currentWorker = newWorker;
        });
        return;
    }

    // Too many restarts, kill process
    if (currentRestartAttempt >= RESTART_ATTEMPTS) {
        log.debug(`No restart attempts left. Exiting.`);
        process.exit(1);
    }

    // Known error restart worker
    currentRestartAttempt++;
    currentWorker = cluster.fork();
};

// Master
if (cluster.isMaster) {
    // Set process name
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

    cluster.on('exit', onWorkerExit);

    // Allow reload on SIGHUP
    process.on('SIGHUP', () => {
        log.debug('<master> Reloading worker');
        currentWorker.send('shutdown');
    });

    // Toggle debug logs
    process.on('SIGUSR1', () => {
        log.debug('<master> Updating log level.');
        currentWorker.send('SIGUSR1');
    });

    // Kill all workers then exit gracefully
    process.on('SIGTERM', () => {
        log.info(`Killing worker`);
        restart = false;
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
