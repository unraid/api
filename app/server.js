/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

/**
 * The Graphql server.
 */
module.exports = function ($injector, fs, net, express, config, log, getEndpoints, stoppable, http) {
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
        async start() {
            // Generate types and schema for core modules
            // {
            //     const jsdocx = $injector.resolve('jsdoc-x');
            //     const path = $injector.resolve('path');
            //     const paths = $injector.resolve('paths');
            //     const moduleDir = path.join(paths.get('core'), '/modules/');
                
            //     console.info('----------------------------')
            //     console.info('Parsing core modules')
            //     const docs = jsdocx.parse(`${moduleDir}/**/*.js`)
            //         .then(docs => {
            //             console.log('%s', JSON.stringify(docs, null, 0))
            //             // const x = gql`
            //             //     type Disk {
            //             //         id: String!
            //             //     }
            //             // `;
            //         })
            //         .catch(error => console.error(error.stack));
            //     console.info('----------------------------')
            // }
            // (() => {
            //     const documentedTypeDefs = docs
            //         .filter(doc => !doc.undocumented)
            //         .filter(doc => doc.kind === 'typedef')
            //         .filter(doc => !doc.type.names.find(name => name.startsWith('Array')));

            //     documentedTypeDefs.map(doc => {
            //         const props = doc.properties ? Object.values(doc.properties).map(prop => {
            //             const desc = prop.description ? ('"""' + prop.description + '"""') : '';
            //             const reservedWords = {
            //                 boolean: 'Boolean',
            //                 number: 'Number',
            //                 string: 'String'
            //             };
            //             const propType = prop.type.names[0];
            //             const type = Object.keys(reservedWords).includes(propType) ? reservedWords[propType] : propType;

            //             if (doc.name === 'DeviceInfo') {
            //                 console.log({ doc });
            //             }

            //             return `${desc}\n${prop.name}: ${prop.optional ? '[' : ''}${type || 'JSON'}${!prop.optional ? '!' : ']'}`;
            //         }) : [];
            //         const template = `
            //     type ${doc.name} {
            //         ${props.join('\n')}
            //     }
            // `;

            //         return template;
            //     })
            //         .forEach(doc => console.info('%s', doc));
            // })()

            const httpServer = http.createServer(app);

            graphApp.installSubscriptionHandlers(httpServer);

            server = stoppable(httpServer.listen(port, () => {
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