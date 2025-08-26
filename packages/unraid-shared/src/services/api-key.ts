import { ApiKey, ApiKeyWithSecret, Permission } from '../graphql.model.js';
import { Role, AuthAction } from '../graphql.model.js';

export interface ApiKeyService {
    /**
     * Find an API key by its ID
     */
    findById(id: string): Promise<ApiKey | null>;

    /**
     * Find an API key by its ID, including the secret key
     */
    findByIdWithSecret(id: string): ApiKeyWithSecret | null;

    /**
     * Find an API key by a specific field
     */
    findByField(field: keyof ApiKeyWithSecret, value: string): ApiKeyWithSecret | null;

    /**
     * Find an API key by its secret key
     */
    findByKey(key: string): ApiKeyWithSecret | null;

    /**
     * Create a new API key
     */
    create(input: {
        name: string;
        description?: string;
        roles?: Role[];
        permissions?: Permission[] | { resource: string; actions: AuthAction[] }[];
        overwrite?: boolean;
    }): Promise<ApiKeyWithSecret>;

    /**
     * Get all valid permissions that can be assigned to an API key
     */
    getAllValidPermissions(): Permission[];

    /**
     * Convert a string array of permissions to Permission objects
     */
    convertPermissionsStringArrayToPermissions(permissions: string[]): Permission[];

    /**
     * Convert a string array of roles to Role enum values
     */
    convertRolesStringArrayToRoles(roles: string[]): Role[];

    /**
     * Delete one or more API keys
     */
    deleteApiKeys(ids: string[]): Promise<void>;

    /**
     * Get all API keys
     */
    findAll(): Promise<ApiKey[]>;

    /**
     * Ensures an API key exists, creating it if necessary.
     * Used by internal services like Connect and CLI for automatic key management.
     */
    ensureKey(config: {
        name: string;
        description: string;
        roles: Role[];
        legacyNames?: string[];
    }): Promise<string>;

    /**
     * Gets or creates a local API key with the specified name, description, and roles.
     */
    getOrCreateLocalKey(name: string, description: string, roles: Role[]): Promise<string>;
}