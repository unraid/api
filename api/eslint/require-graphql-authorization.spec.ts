import { fileURLToPath } from 'node:url';

import { ESLint, RuleTester } from 'eslint';
import tseslint from 'typescript-eslint';
import { describe, expect, it } from 'vitest';

import rule from './require-graphql-authorization.mjs';

RuleTester.describe = describe;
RuleTester.it = it;
const tester = new RuleTester({ languageOptions: { parser: tseslint.parser } });
const handlerImports = "import { Query, Mutation, Subscription, ResolveField } from '@nestjs/graphql';";
const permissionsImport =
    "import { UsePermissions } from '@unraid/shared/use-permissions.directive.js';";
const publicImport = "import { Public } from '@app/unraid-api/auth/public.decorator.js';";
const authenticatedImport =
    "import { Authenticated } from '@app/unraid-api/auth/authenticated.decorator.js';";
const permission = "@UsePermissions({ action: 'READ_ANY', resource: 'CONFIG' })";

const code = (decorators: string, imports = permissionsImport) => `${handlerImports} ${imports}
class Resolver { ${decorators} arbitraryName() { return true; } }`;

tester.run('require-graphql-authorization', rule, {
    valid: [
        ...['Query', 'Mutation', 'Subscription', 'ResolveField'].map((name) =>
            code(`@${name}(() => Boolean) ${permission}`)
        ),
        code(`${permission} @Query(() => Boolean)`),
        code('@Query(() => Boolean) @Public()', publicImport),
        code('@Mutation(() => Boolean) @Authenticated()', authenticatedImport),
        code('@Query(() => Boolean) @UsePermissions(permission)', permissionsImport),
        code(`@Query(() => Boolean) ${permission}`, "import { UsePermissions } from 'nest-authz';"),
        "import { Query as Read } from '@nestjs/graphql'; import { UsePermissions as Policy } from 'nest-authz'; class R { @Read(() => Boolean) @Policy({ action: 'READ_ANY', resource: 'CONFIG' }) value() {} }",
        "import * as gql from '@nestjs/graphql'; import * as auth from 'nest-authz'; class R { @gql.Query(() => Boolean) @auth.UsePermissions({ action: 'READ_ANY', resource: 'CONFIG' }) value() {} }",
        "import * as gql from '@nestjs/graphql'; import * as auth from 'nest-authz'; class R { @(gql['Query'])(() => Boolean) @(auth['UsePermissions'])({ action: 'READ_ANY', resource: 'CONFIG' }) value() {} }",
        code(''),
        "import { Query } from 'unrelated'; class R { @Query() value() {} }",
    ],
    invalid: [
        ...['Query', 'Mutation', 'Subscription', 'ResolveField'].map((name) => ({
            code: code(`@${name}(() => Boolean)`),
            errors: [{ messageId: 'missing' }],
        })),
        {
            code: "import { Query as Read } from '@nestjs/graphql'; class R { @Read(() => Boolean) renamed() {} }",
            errors: [{ messageId: 'missing' }],
        },
        {
            code: "import * as gql from '@nestjs/graphql'; class R { @gql.Mutation(() => Boolean) renamed() {} }",
            errors: [{ messageId: 'missing' }],
        },
        {
            code: code('@Query(() => Boolean) @UseGuards(AuthZGuard)'),
            errors: [{ messageId: 'missing' }],
        },
        {
            code: code('@Query(() => Boolean) @Public()', "import { Public } from 'unrelated';"),
            errors: [{ messageId: 'missing' }],
        },
        {
            code: `${handlerImports} ${publicImport} @Public() class R { @Query(() => Boolean) value() {} }`,
            errors: [{ messageId: 'missing' }],
        },
        {
            code: `${handlerImports} ${permissionsImport} function factory(UsePermissions) { return class { @Query(() => Boolean) ${permission} value() {} }; }`,
            errors: [{ messageId: 'missing' }],
        },
        ...['', '{}', '[]', 'null', "{ action: 'READ_ANY' }"].map((args) => ({
            code: code(`@Query(() => Boolean) @UsePermissions(${args})`),
            errors: [{ messageId: 'empty' }],
        })),
        {
            code: code(
                '@Query(() => Boolean) @Public() @UsePermissions()',
                `${publicImport} ${permissionsImport}`
            ),
            errors: [{ messageId: 'empty' }],
        },
    ],
});

// Loading the full ESLint config includes TypeScript transpilation and plugin startup.
// Allow for that cold start while CI runs coverage across packages concurrently.
describe('authorization lint configuration', { timeout: 30_000 }, () => {
    const cwd = fileURLToPath(new URL('..', import.meta.url));
    it.each([
        ['.eslintrc.ts', 'src/new-handler.ts'],
        ['eslint/graphql-authorization.config.mjs', 'api/src/new-handler.ts'],
        [
            'eslint/graphql-authorization.config.mjs',
            'packages/unraid-api-plugin-connect/src/new-handler.ts',
        ],
    ])('rejects an unguarded endpoint using %s at %s', async (config, filePath) => {
        const eslint = new ESLint({
            cwd: config === '.eslintrc.ts' ? cwd : fileURLToPath(new URL('../..', import.meta.url)),
            overrideConfigFile: fileURLToPath(new URL(`../${config}`, import.meta.url)),
        });
        const results = await eslint.lintText(code('@Mutation(() => Boolean)'), { filePath });
        expect(
            results
                .flatMap((result) => result.messages)
                .filter((message) => message.ruleId === 'unraid-auth/require-graphql-authorization')
        ).toHaveLength(1);
    });
    it('keeps deliberate test fixtures outside the production policy', async () => {
        const eslint = new ESLint({ cwd, overrideConfigFile: '.eslintrc.ts' });
        const results = await eslint.lintText(code('@Query(() => Boolean)'), {
            filePath: 'src/negative-fixture.spec.ts',
        });
        expect(
            results
                .flatMap((result) => result.messages)
                .filter((message) => message.ruleId === 'unraid-auth/require-graphql-authorization')
        ).toHaveLength(0);
    });
});
