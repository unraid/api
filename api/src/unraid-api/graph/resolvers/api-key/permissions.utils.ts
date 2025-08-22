import { Resource } from '@unraid/shared/graphql.model.js';
import { AuthAction } from 'nest-authz';

/**
 * Validates if an action string corresponds to a valid AuthAction enum value
 * @param action - The action string to validate
 * @returns True if the action is a valid AuthAction value
 */
export function isValidAuthAction(action: string): boolean {
    return Object.values(AuthAction).includes(action as AuthAction);
}

/**
 * Normalizes action strings to ensure consistent representation across the system.
 * Handles various input formats and maps them to canonical AuthAction values.
 *
 * @param action - The action string to normalize (e.g., 'read', 'READ_ANY', 'read:any')
 * @returns The canonical action string in lowercase colon-delimited format (e.g., 'read:any')
 * @throws Error if the action cannot be mapped to a valid AuthAction enum value
 */
export function normalizeAction(action: string): string {
    // Apply consistent transformations
    const normalized = action.trim().toLowerCase().replace(/_/g, ':'); // Convert underscores to colons

    // Handle wildcard
    if (normalized === '*') {
        return '*';
    }

    // Check if it's already a valid AuthAction value
    if (Object.values(AuthAction).includes(normalized as AuthAction)) {
        return normalized;
    }

    // Map simple verbs to AuthAction format with ':any' suffix
    const simpleVerbs: Record<string, string> = {
        create: AuthAction.CREATE_ANY,
        read: AuthAction.READ_ANY,
        update: AuthAction.UPDATE_ANY,
        delete: AuthAction.DELETE_ANY,
    };

    if (simpleVerbs[normalized]) {
        return simpleVerbs[normalized];
    }

    // Try to get from enum key for backward compatibility (e.g., 'READ_ANY' -> 'read:any')
    const enumKey = action.trim().toUpperCase().replace(/:/g, '_') as keyof typeof AuthAction;
    if (enumKey in AuthAction) {
        return AuthAction[enumKey];
    }

    // Throw error for invalid actions
    throw new Error(`Invalid action "${action}" - must be a valid AuthAction enum value`);
}

/**
 * Merges permissions from a source map into a target map, combining actions for each resource.
 * The target map uses Sets to store unique actions per resource, while the source map uses arrays.
 * This function ensures no duplicate actions are added to the target map.
 */
export function mergePermissionsIntoMap(
    targetMap: Map<Resource, Set<string>>,
    sourceMap: Map<Resource, string[]>
): void {
    for (const [resource, actions] of sourceMap) {
        if (!targetMap.has(resource)) {
            targetMap.set(resource, new Set());
        }
        const resourceActions = targetMap.get(resource)!;
        actions.forEach((action) => resourceActions.add(action));
    }
}

/**
 * Expands a wildcard action ('*') into the full set of CRUD operations
 */
export function expandWildcardAction(): string[] {
    return [AuthAction.CREATE_ANY, AuthAction.READ_ANY, AuthAction.UPDATE_ANY, AuthAction.DELETE_ANY];
}

/**
 * Reconciles wildcard permissions by applying them to all valid resources.
 * If a wildcard ('*') key exists in the permissions map, its actions are merged
 * into all valid Resource enum values, then the wildcard key is removed.
 */
export function reconcileWildcardPermissions(permissionsMap: Map<Resource | '*', Set<string>>): void {
    const wildcardActions = permissionsMap.get('*');
    if (!wildcardActions) return;

    // Remove wildcard key from map
    permissionsMap.delete('*');

    // Apply wildcard actions to all valid resources
    // Object.values gets the enum values directly
    for (const resource of Object.values(Resource)) {
        if (!permissionsMap.has(resource)) {
            permissionsMap.set(resource, new Set());
        }
        const resourceActions = permissionsMap.get(resource)!;
        wildcardActions.forEach((action) => resourceActions.add(action));
    }
}

/**
 * Converts a permissions map with Sets to a map with arrays
 */
export function convertPermissionSetsToArrays(
    permissionsWithSets: Map<Resource | '*', Set<string>>
): Map<Resource, string[]> {
    const permissions = new Map<Resource, string[]>();
    for (const [resource, actionsSet] of permissionsWithSets) {
        // Skip wildcard key if it somehow still exists
        if (resource === '*') continue;
        permissions.set(resource as Resource, Array.from(actionsSet));
    }
    return permissions;
}
