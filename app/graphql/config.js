/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

const envs = process.env;
const env = envs.NODE_ENV === 'production';
const debug = envs.DEBUG;

const GRAPHQL_PORT = envs.GRAPHQL_PORT || 5000;
const GRAPHQL_HOST = envs.GRAPHQL_HOST || 'localhost';
const MYSERVERS_PORT = envs.MYSERVERS_PORT || 9500;
const MYSERVERS_HOST = envs.MYSERVERS_HOST || 'localhost';
const MYSERVERS_API_PROTO = envs.MYSERVERS_API_PROTO || env ? 'unix' : 'http';
const MYSERVERS_WS_PROTO = envs.MYSERVERS_WS_PROTO || 'ws';
const MYSERVERS_URI = envs.MYSERVERS_URI || env ? 'unix:/var/run/api.sock:/' : (`${MYSERVERS_API_PROTO}://${MYSERVERS_HOST}:${MYSERVERS_PORT}`);

const config = {
	debug,
	graphql: {
		port: GRAPHQL_PORT,
		host: GRAPHQL_HOST
	},
	myservers: {
		port: MYSERVERS_PORT,
		host: MYSERVERS_HOST,
		ws: {
			proto: MYSERVERS_WS_PROTO
		},
		api: {
			proto: MYSERVERS_API_PROTO,
			uri: MYSERVERS_URI
		}
	}
};

module.exports = config;
