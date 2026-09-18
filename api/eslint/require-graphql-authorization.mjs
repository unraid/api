const graphqlHandlers = new Set(['Query', 'Mutation', 'Subscription', 'ResolveField']);
const permissionSources = new Set(['@unraid/shared/use-permissions.directive.js', 'nest-authz']);
const accessMarkers = new Map([
    ['@app/unraid-api/auth/public.decorator.js', 'Public'],
    ['@app/unraid-api/auth/authenticated.decorator.js', 'Authenticated'],
]);

function importedDecorator(context, decorator) {
    const call = decorator.expression;
    if (call.type !== 'CallExpression') return;
    const callee = call.callee;
    const identifier = callee.type === 'Identifier' ? callee : callee.object;
    if (identifier?.type !== 'Identifier') return;
    let scope = context.sourceCode.getScope(decorator);
    while (scope) {
        const variable = scope.set.get(identifier.name);
        if (variable) {
            const definition = variable.defs.find((entry) => entry.type === 'ImportBinding');
            if (!definition) return;
            const specifier = definition.node;
            const source = definition.parent.source.value;
            if (callee.type === 'Identifier' && specifier.type === 'ImportSpecifier') {
                return { source, name: specifier.imported.name ?? specifier.imported.value, call };
            }
            if (callee.type === 'MemberExpression' && specifier.type === 'ImportNamespaceSpecifier') {
                const name = callee.computed ? callee.property.value : callee.property.name;
                return { source, name, call };
            }
            return;
        }
        scope = scope.upper;
    }
}

function hasPermissionArgument(call) {
    return (
        call.arguments.length > 0 &&
        call.arguments.every((argument) => {
            if (argument.type === 'ObjectExpression') {
                const keys = new Set(
                    argument.properties
                        .filter((property) => property.type === 'Property')
                        .map((property) => property.key.name ?? property.key.value)
                );
                return keys.has('action') && keys.has('resource');
            }
            return !['Literal', 'ArrayExpression'].includes(argument.type);
        })
    );
}

/** @type {import('eslint').Rule.RuleModule} */
export default {
    meta: {
        type: 'problem',
        docs: { description: 'Require an explicit access policy on each GraphQL handler' },
        schema: [],
        messages: {
            missing:
                'GraphQL handlers require @UsePermissions(...), @Public(), or @Authenticated() on the method. @UseGuards alone does not declare permissions.',
            empty: '@UsePermissions must declare an action and resource; empty permission metadata is denied at runtime.',
        },
    },
    create(context) {
        return {
            MethodDefinition(node) {
                const decorators = (node.decorators ?? [])
                    .map((decorator) => importedDecorator(context, decorator))
                    .filter(Boolean);
                if (
                    !decorators.some(
                        ({ source, name }) => source === '@nestjs/graphql' && graphqlHandlers.has(name)
                    )
                )
                    return;
                const permissions = decorators.filter(
                    ({ source, name }) => permissionSources.has(source) && name === 'UsePermissions'
                );
                if (permissions.length) {
                    if (permissions.some(({ call }) => !hasPermissionArgument(call))) {
                        context.report({ node, messageId: 'empty' });
                    }
                    return;
                }
                if (
                    !decorators.some(
                        ({ source, name }) =>
                            accessMarkers.has(source) && accessMarkers.get(source) === name
                    )
                ) {
                    context.report({ node, messageId: 'missing' });
                }
            },
        };
    },
};
