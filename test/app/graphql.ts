import ava, { TestInterface } from 'ava';
import getSemverRegex from 'semver-regex';
import { agent } from 'supertest';
import { gql } from 'apollo-server-express';
import { server } from '../../app/server';
import { createGraphqlRequestMacro } from '../_helpers';

const semverRegex = getSemverRegex();

const test = ava as TestInterface<{
    requestMacro: ReturnType<typeof createGraphqlRequestMacro>;
    apiKey: string;
}>;

test.beforeEach(async t => {
    const request = agent(server.httpServer);
    t.context.requestMacro = createGraphqlRequestMacro(request);
    t.context.apiKey = 'TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST_TEST';
});

test('fetch current user', async t => {
    await t.context.requestMacro(t, {
        query: gql`
            query {
                me {
                    id
                    name
                }
            }
        `,
        apiKey: t.context.apiKey
    }, {
        status: 200,
        data: {
            me: {
                id: /([0-9]+)/,
                name: 'root'
            }
        }
    });
});

test('fetch /info', async t => {
    await t.context.requestMacro(t, {
        query: gql`
            query {
                info {
                    apps {
                        installed
                        started
                    }
                    machineId
                    os {
                       hostname
                    }
                    versions {
                        unraid
                    }
                }
            }
        `,
        apiKey: t.context.apiKey
    }, {
        status: 200,
        data: {
            info: {
                apps: {
                    installed: /[0-9]/,
                    started: /[0-9]/
                },
                os: {
                    hostname: /([a-z0-9\-\.]+)/i
                },
                versions: {
                    unraid: semverRegex
                }
            }
        }
    });
});