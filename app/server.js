/*
 * Copyright 2005-2019, Lime Technology
 * Copyright 2018-2019, Alexis Tyler
 *
 * This program is free software; you can redistribute it and/or
 * modify it under the terms of the GNU General Public License version 2,
 * as published by the Free Software Foundation.
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 */

/**
 * The Graphql server.
 */
module.exports = function ($injector, fs, net, express, config, log, getEndpoints, stoppable) {
    const app = express();
    const port = config.get('graphql-api-port');
    let server;

    const ApolloServer = $injector.resolve('apollo-server-express').ApolloServer;
    const graphql = $injector.resolvePath(__dirname + '/graphql');

    // Mount graph endpoint
    const graphApp = new ApolloServer(graphql);
    graphApp.applyMiddleware({ app });

    // List all endpoints at start of server
    app.get('/', (_, res) => {
        return res.send(getEndpoints(app));
    });

    // Handle errors by logging them and returning a 500.
    app.use(function (error, _, res, __) {
        log.error(error);
        if (error.stack) {
            error.stackTrace = error.stack;
        }
        res.status(error.status || 500).send(error);
    });

    // Return an object with start and stop methods.
    return {
        start() {
            server = stoppable(app.listen(port, () => {
                // Downgrade process user to owner of this file
                return fs.stat(__filename, (error, stats) => {
                    if (error) {
                        throw error;
                    }

                    return process.setuid(stats.uid);
                });
            }));

            // Port is a UNIX socket file
            if (isNaN(parseInt(port, 10))) {
                server.on('listening', () => {
                    // In production this will let pm2 know we're ready
                    if (process.send) {
                        process.send('ready');
                    }

                    // Set permissions
                    return fs.chmodSync(port, 777);
                });

                // Double-check EADDRINUSE
                server.on('error', error => {
                    if (error.code !== 'EADDRINUSE') {
                        throw error;
                    }

                    net.connect({
                        path: port
                    }, () => {
                        // Really in use: re-throw
                        throw error;
                    }).on('error', error => {
                        if (error.code !== 'ECONNREFUSED') {
                            throw error;
                        }

                        // Not in use: delete it and re-listen
                        fs.unlinkSync(port);
                        server.listen(port);
                    });
                });
            }

            return server;
        },
        stop() {
            // Stop the server from accepting new connections and close existing connections
            return server.close(error => {
                if (error) {
                    log.error(error);
                    // Exit with error (code 1)
                    // eslint-disable-next-line
                    process.exit(1);
                }

                log.info('Server shutting down..');

                // Gracefully exit
                process.exitCode = 0;
            });
        }
    };
};