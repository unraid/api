const path = require('path');
const cluster = require('cluster');

const RESTART_ATTEMPTS = 10;
let currentRestartAttempt = 0;

if (cluster.isMaster) {
    cluster.fork();

    cluster.on('exit', (worker, code, signal) => {
        if (code !== 7) {
            process.exit(code);
        }

        if (currentRestartAttempt < RESTART_ATTEMPTS) {
            currentRestartAttempt++;
            cluster.fork();
        }

        console.debug(`No restart attempts left. Exiting.`);
        process.exit(1);
    });
}

if (cluster.isWorker) {
    // @ts-ignore
    const package = require('./package.json');
    const { main, name } = package;

    if (!main) {
        console.error('Missing main field in package.json');
        process.exit(1);
    }

    const mainPath = path.resolve(__dirname, main);

    try {
        require(mainPath);
    } catch {
        console.error(`Could not load main field "${mainPath}".`);
        process.exit(1);
    }
}