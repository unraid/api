/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

const env = process.env.NODE_ENV === 'production';

const GRAPHQL_PORT = process.env.GRAPHQL_PORT || 5000;
const GRAPHQL_HOST = process.env.GRAPHQL_HOST || 'localhost';
const MYSERVERS_PORT = process.env.MYSERVERS_PORT || 9500;
const MYSERVERS_HOST = process.env.MYSERVERS_HOST || 'localhost';
const MYSERVERS_API_PROTO = process.env.MYSERVERS_API_PROTO || env ? 'unix' : 'http';
const MYSERVERS_WS_PROTO = process.env.MYSERVERS_WS_PROTO || 'ws';
const MYSERVERS_URI = process.env.MYSERVERS_URI || env ? 'unix:/var/run/api.sock:/' : (`${MYSERVERS_API_PROTO}://${MYSERVERS_HOST}:${MYSERVERS_PORT}`);

const config = {
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

export default config;