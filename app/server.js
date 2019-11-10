/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

/**
 * The Graphql server.
 */
module.exports = function ($injector, path, fs, net, express, config, log, getEndpoints, stoppable, http) {
	const app = express();
	const port = config.get('graphql-api-port');
	const {ApolloServer} = $injector.resolve('apollo-server-express');
	const graphql = $injector.resolvePath(path.join(__dirname, '/graphql'));
	let machineId;

	app.use(async (req, res, next) => {
		// Only get the machine ID on first request
		// We do this to avoid using async in the main server function
		if (!machineId) {
			// eslint-disable-next-line require-atomic-updates
			machineId = await $injector.resolveModule('module:info/get-machine-id').then(result => result.json);
		}

		// Update header with machine ID
		res.set('x-machine-id', machineId);

		next();
	});

	// Mount graph endpoint
	const graphApp = new ApolloServer(graphql);
	graphApp.applyMiddleware({app});

	// List all endpoints at start of server
	app.get('/', (_, res) => {
		return res.send(getEndpoints(app));
	});

	// Handle errors by logging them and returning a 500.
	// eslint-disable-next-line no-unused-vars
	app.use((error, _, res, __) => {
		log.error(error);
		if (error.stack) {
			error.stackTrace = error.stack;
		}

		res.status(error.status || 500).send(error);
	});

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
	const server = stoppable(httpServer);

	const handleError = error => {
		if (error.code !== 'EADDRINUSE') {
			throw error;
		}

		if (!isNaN(parseInt(port, 10))) {
			throw error;
		}

		server.close();

		net.connect({
			path: port
		}, () => {
			// Really in use: re-throw
			throw error;
		}).on('error', error => {
			if (error.code !== 'ECONNREFUSED') {
				log.error(error);

				process.exitCode = 1;
			}

			// Not in use: delete it and re-listen
			fs.unlinkSync(port);

			setTimeout(() => {
				server.listen(port);
			}, 1000);
		});
	};

	// Port is a UNIX socket file
	if (isNaN(parseInt(port, 10))) {
		server.on('listening', () => {
			// In production this will let pm2 know we're ready
			if (process.send) {
				process.send('ready');
			}

			// Set permissions
			return fs.chmodSync(port, 660);
		});

		server.on('error', handleError);

		process.on('uncaughtException', error => {
			// Skip EADDRINUSE as it's already handled above
			if (error.code !== 'EADDRINUSE') {
				throw error;
			}
		});
	}

	// Add graphql subscription handlers
	graphApp.installSubscriptionHandlers(server);

	// Return an object with a server and start/stop async methods.
	return {
		server,
		async start() {
			return server.listen(port, () => {
				// Downgrade process user to owner of this file
				return fs.stat(__filename, (error, stats) => {
					if (error) {
						throw error;
					}

					return process.setuid(stats.uid);
				});
			});
		},
		stop() {
			// Stop the server from accepting new connections and close existing connections
			return server.close(error => {
				if (error) {
					log.error(error);
					// Exit with error (code 1)
					// eslint-disable-next-line unicorn/no-process-exit
					process.exit(1);
				}

				const name = process.title;
				const serverName = `@unraid/${name}`;
				log.info(`Successfully stopped ${serverName}`);

				// Gracefully exit
				process.exitCode = 0;
			});
		}
	};
};
