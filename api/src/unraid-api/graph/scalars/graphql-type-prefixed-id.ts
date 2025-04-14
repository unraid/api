import { CustomScalar, Scalar } from '@nestjs/graphql';

import { Kind, ValueNode } from 'graphql';

import { getServerIdentifier } from '@app/core/utils/server-identifier.js';

@Scalar('PrefixedID', () => PrefixedID)
export class PrefixedID implements CustomScalar<string, string> {
    description: string =
        `
### Description:

ID scalar type that prefixes the underlying ID with the server identifier on output and strips it on input.

We use this scalar type to ensure that the ID is unique across all servers, allowing the same underlying resource ID to be used across different server instances.

#### Input Behavior:

When providing an ID as input (e.g., in arguments or input objects), the server identifier prefix ('<serverId>:') is optional.

- If the prefix is present (e.g., '123:456'), it will be automatically stripped, and only the underlying ID ('456') will be used internally.
- If the prefix is absent (e.g., '456'), the ID will be used as-is.

This makes it flexible for clients, as they don't strictly need to know or provide the server ID.

#### Output Behavior:

When an ID is returned in the response (output), it will *always* be prefixed with the current server's unique identifier (e.g., '123:456').

#### Example:

Note: The server identifier is '123' in this example.

##### Input (Prefix Optional):
\`\`\`graphql
# Both of these are valid inputs resolving to internal ID '456'
{
  someQuery(id: "123:456") { ... }
  anotherQuery(id: "456") { ... }
}
\`\`\`

##### Output (Prefix Always Added):
\`\`\`graphql
# Assuming internal ID is '456'
{
  "data": {
    "someResource": {
      "id": "123:456" 
    }
  }
}
\`\`\`
        `;

    // For output: Add the prefix
    serialize(value: unknown): string {
        if (typeof value !== 'string') {
            // Consider logging this error or handling it based on your specific needs
            console.error(`PrefixedID cannot represent non-string value: ${value}`);
            throw new Error(`PrefixedID cannot represent non-string value: ${value}`);
        }
        // Simple check to avoid double-prefixing if somehow already prefixed
        // This might happen if data is fetched internally already prefixed
        if (value.includes(':')) {
            // Optionally log or verify if the prefix matches the current serverId
            // const serverId = this.serverIdentifierService.getId();
            // if (!value.startsWith(`${serverId}:`)) {
            //     console.warn(`PrefixedID serialize: Value '${value}' already has a different prefix.`);
            // }
            return value;
        }
        const serverId = getServerIdentifier();
        return `${serverId}:${value}`;
    }

    // For input variables: Remove the prefix
    parseValue(value: unknown): string {
        if (typeof value !== 'string') {
            throw new Error(`PrefixedID cannot represent non-string value: ${value}`);
        }
        // Expecting '<serverId>:<originalId>'
        const parts = value.split(':');
        if (parts.length === 2) {
            return parts[1];
        }
        // If it doesn't have the prefix format, assume it's an internal ID already.
        // console.debug(`PrefixedID parseValue: Value '${value}' does not contain expected prefix.`);
        return value;
    }

    // For inline query arguments: Remove the prefix
    parseLiteral(ast: ValueNode): string {
        if (ast.kind !== Kind.STRING) {
            // Handle or throw error for non-string literals if necessary
            throw new Error(
                `PrefixedID cannot represent non-string literal value: ${'value' in ast ? ast.value : null}`
            );
        }
        // Same logic as parseValue
        const parts = ast.value.split(':');
        if (parts.length === 2) {
            return parts[1];
        }
        // console.debug(`PrefixedID parseLiteral: Value '${ast.value}' does not contain expected prefix.`);
        return ast.value;
    }
}
