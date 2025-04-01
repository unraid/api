import { AuthPossession } from 'nest-authz';
import { AuthActionVerb } from 'nest-authz/dist/src/types.js';

/**
 * Generates GraphQL SDL strings for the authentication enums.
 */
export function getAuthEnumTypeDefs(): string {
    // Helper to generate enum values string part with descriptions
    const getEnumValues = <T>(tsEnum: Record<string, T>): string => {
        return Object.entries(tsEnum)
            .filter(([key]) => isNaN(Number(key))) // Filter out numeric keys
            .map(([key]) => `  ${key}`)
            .join('\n');
    };

    return `"""
Available authentication action verbs
"""
enum AuthActionVerb {
${getEnumValues(AuthActionVerb)}
}

"""
Available authentication possession types
"""
enum AuthPossession {
${getEnumValues(AuthPossession)}
}

directive @auth(
  action: AuthActionVerb!, 
  resource: String!, 
  possession: AuthPossession!
) on FIELD_DEFINITION
`;
}
