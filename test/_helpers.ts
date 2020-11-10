// @ts-check
import { ExecutionContext } from 'ava';
import supertest from 'supertest';
import { gql } from 'apollo-server-express';
import pEachSeries from 'p-each-series';
import pMap from 'p-map';

interface BasicInput {
    url: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    query?: string | object;
    body?: string | object;
};

interface BasicExpected {
    status?: number;
    body?: {
        [key: string]: any;
    }
    text: string;
};

interface GraphqlInput {
    apiKey: string;
    query: ReturnType<typeof gql> | string;
    variables?: object;
};

interface GraphqlExpected {
    data?: { [key: string]: any };
    errors?: any[];
    status?: number;
};

export const queryToString = query => typeof query === 'string' ? query : query?.loc?.source?.body;

export const sendGraphqlRequest = (request: ReturnType<typeof supertest>) => (input: GraphqlInput) => {
    return request
        .post('/graphql')
        .set({
            Accept: 'application/json',
            'x-api-key': input.apiKey ?? '123456789'
        })
        .send({
            query: queryToString(input.query),
            ...(input.variables ? { variables: input.variables } : {})
        });
};

export const getObjectWithRegex = async (input: object, expected: object) => {
    if (typeof input === 'object' && typeof expected === 'object') {
        return pMap(Object.entries(input), async ([key, value]) => {
            // Check regex
            if (expected[key] instanceof RegExp) {
                const regex = expected[key];
                const match = regex.exec(input[key]);

                // Reset lastIndex since this uses a /g flag
                // https://stackoverflow.com/a/21123303/2311366
                if (regex.global) {
                    expected[key].lastIndex = 0;
                }

                return [key, match ? match[0] : match];
            }
        
            if (typeof expected[key] === 'object') {
                return [key, await getObjectWithRegex(input[key], expected[key])];
            }
        
            return [key, value];
        }).then(entries => JSON.parse(JSON.stringify(Object.fromEntries(entries as []))));
    }
};

export const checkObject = async (t: ExecutionContext, input: object, expected: object) => {
    if (typeof input === 'object' && typeof expected === 'object') {
        return pEachSeries(Object.entries(expected), ([key, value]) => {
            // Check regex
            if (value instanceof RegExp) {
                t.regex(`${input[key]}`, value);
                return;
            }

            // It's an object, let's go deeper
            if (typeof value === 'object') {
                return checkObject(t, input[key], value);
            }
        
            // Check normal value
            t.is(input[key], value);
        });
    }
};

/**
 * Basic request helper
 */
export const createBasicRequestMacro = (request: ReturnType<typeof supertest>) => async (t: ExecutionContext, input: BasicInput, expected: BasicExpected) => {
    // Send request
    const response = await request[input.method.toLowerCase()](input.url).set('Accept', 'application/json').query(input.query).send(input.body);

    // If we expect an "ok" then check we have a body
    if (expected.status === 200) {
        t.false(response.body === undefined);
    }

    // String response
    if (typeof expected.text === 'string') {
        t.is(response.text, expected.text);
    }

    // Object response
    if (typeof expected.body === 'object') {
        // Compare body including running any regex we have
        await checkObject(t, response.body, expected.body);

        // Snapshot
        t.snapshot(await getObjectWithRegex(response.body, expected.body), queryToString(input.query));
    }
};

/**
 * Graphql request helper
 */
export const createGraphqlRequestMacro = (request: ReturnType<typeof supertest>) => async (t: ExecutionContext, input: GraphqlInput, expected: GraphqlExpected) => {
    const response = await sendGraphqlRequest(request)(input);

    // If we expect an "ok" then check we have no errors,
    // else check the errors against our errors array
    if (expected.status === 200) {
        t.is(response.body.errors, undefined);
    } else {
        // We need to use "deepEqual" instead of "is" since this is an array
        t.deepEqual(response.body.errors, expected.errors);
    }

    // Compare body data including running any regex we have
    await checkObject(t, response.body.data, expected.data);

    // Snapshot
    t.snapshot(await getObjectWithRegex(response.body.data, expected.data), queryToString(input.query));
};