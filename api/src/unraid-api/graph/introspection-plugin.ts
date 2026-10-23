import type { ApolloServerPlugin, GraphQLRequestListener } from '@apollo/server';
import type { DocumentNode, OperationDefinitionNode, SelectionSetNode } from 'graphql';
import { Kind, parse } from 'graphql';

const BLOCKED_INTROSPECTION_FIELDS = new Set(['__schema', '__type']);

const hasBlockedIntrospectionField = (
    selectionSet: SelectionSetNode,
    fragments: Map<string, SelectionSetNode>,
    visitedFragments = new Set<string>(),
    atQueryRoot = true,
    fragmentResults = new Map<string, boolean>()
): boolean =>
    selectionSet.selections.some((selection) => {
        if (selection.kind === Kind.FIELD) {
            return (
                (atQueryRoot && BLOCKED_INTROSPECTION_FIELDS.has(selection.name.value)) ||
                (selection.selectionSet !== undefined &&
                    hasBlockedIntrospectionField(
                        selection.selectionSet,
                        fragments,
                        visitedFragments,
                        false,
                        fragmentResults
                    ))
            );
        }

        if (selection.kind === Kind.INLINE_FRAGMENT) {
            return hasBlockedIntrospectionField(
                selection.selectionSet,
                fragments,
                visitedFragments,
                atQueryRoot,
                fragmentResults
            );
        }

        const fragmentKey = `${selection.name.value}:${atQueryRoot ? 'root' : 'nested'}`;
        const cachedResult = fragmentResults.get(fragmentKey);
        if (cachedResult !== undefined) {
            return cachedResult;
        }

        if (visitedFragments.has(selection.name.value)) {
            return false;
        }

        const fragmentSelectionSet = fragments.get(selection.name.value);
        if (!fragmentSelectionSet) {
            return false;
        }

        visitedFragments.add(selection.name.value);
        const blocked = hasBlockedIntrospectionField(
            fragmentSelectionSet,
            fragments,
            visitedFragments,
            atQueryRoot,
            fragmentResults
        );
        visitedFragments.delete(selection.name.value);
        fragmentResults.set(fragmentKey, blocked);
        return blocked;
    });

const isBlockedIntrospectionOperation = (
    operation: OperationDefinitionNode,
    document: DocumentNode
): boolean => {
    const fragments = new Map(
        document.definitions
            .filter((definition) => definition.kind === Kind.FRAGMENT_DEFINITION)
            .map((definition) => [definition.name.value, definition.selectionSet])
    );

    return hasBlockedIntrospectionField(operation.selectionSet, fragments);
};

const getOperationFromDocument = (document: DocumentNode, operationName?: string) => {
    const operations = document.definitions.filter(
        (definition): definition is OperationDefinitionNode =>
            definition.kind === Kind.OPERATION_DEFINITION
    );

    return (
        operations.find((operation) => operation.name?.value === operationName) ??
        (operations.length === 1 ? operations[0] : undefined)
    );
};

const blockedIntrospectionBody = () => ({
    kind: 'single' as const,
    singleResult: {
        errors: [
            {
                message:
                    'GraphQL introspection is not allowed, but the current request is for introspection.',
                extensions: {
                    code: 'INTROSPECTION_DISABLED',
                },
            },
        ],
    },
});

export const createDynamicIntrospectionPlugin = (
    isSandboxEnabled: () => boolean
): ApolloServerPlugin => ({
    requestDidStart: async () =>
        ({
            responseForOperation: async ({ document, operation, response }) => {
                if (!isSandboxEnabled() && isBlockedIntrospectionOperation(operation, document)) {
                    return {
                        http: {
                            status: 400,
                            headers: response.http.headers,
                        },
                        body: blockedIntrospectionBody(),
                    };
                }

                return null;
            },
            willSendResponse: async (requestContext) => {
                const { request, response } = requestContext;

                if (requestContext.operation || requestContext.document) {
                    return;
                }

                if (!isSandboxEnabled() && request.query) {
                    try {
                        const document = parse(request.query);
                        const operation = getOperationFromDocument(document, request.operationName);

                        if (operation && isBlockedIntrospectionOperation(operation, document)) {
                            response.body = blockedIntrospectionBody();
                            if (response.http) {
                                response.http.status = 400;
                            }
                        }
                    } catch {
                        return;
                    }
                }
            },
        }) satisfies GraphQLRequestListener<any>,
});
