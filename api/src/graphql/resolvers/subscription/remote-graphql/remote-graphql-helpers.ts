import { gql, type QueryOptions } from '@apollo/client';

interface ParsedQuery {
    query?: string;
    variables?: Record<string, string>;
}

export const parseGraphQLQuery = (body: string): QueryOptions => {
    try {
        const parsedBody: ParsedQuery = JSON.parse(body);
        if (
            parsedBody.query &&
            parsedBody.variables &&
            typeof parsedBody.variables === 'object'
        ) {
            return {
                query: gql(parsedBody.query),
                variables: parsedBody.variables,
            };
        }
        throw new Error('Invalid Body');
    } catch (error) {
        throw new Error('Invalid Body Provided');
    }
};
