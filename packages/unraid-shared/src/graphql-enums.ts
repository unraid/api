// This file contains only the enum definitions without any NestJS dependencies
// Safe to import in both frontend and backend

// Define our own AuthAction enum with matching keys and values
// This ensures GraphQL schema and runtime values are identical
export enum AuthAction {
    CREATE_ANY = 'CREATE_ANY',
    CREATE_OWN = 'CREATE_OWN',
    READ_ANY = 'READ_ANY', 
    READ_OWN = 'READ_OWN',
    UPDATE_ANY = 'UPDATE_ANY',
    UPDATE_OWN = 'UPDATE_OWN',
    DELETE_ANY = 'DELETE_ANY',
    DELETE_OWN = 'DELETE_OWN',
}

// Keep these for backward compatibility if needed
export enum AuthActionVerb {
    CREATE = 'CREATE',
    UPDATE = 'UPDATE',
    DELETE = 'DELETE',
    READ = 'READ',
}

export enum AuthPossession {
    ANY = 'ANY',
    OWN = 'OWN',
}

// Define Resource enum
export enum Resource {
    /** Activation code management and validation */
    ACTIVATION_CODE = 'ACTIVATION_CODE',
    /** API key management and administration */
    API_KEY = 'API_KEY',
    /** Array operations and disk management */
    ARRAY = 'ARRAY',
    /** Cloud storage and backup services */
    CLOUD = 'CLOUD',
    /** System configuration and settings */
    CONFIG = 'CONFIG',
    /** Unraid Connect service management */
    CONNECT = 'CONNECT',
    /** Remote access functionality for Connect */
    CONNECT__REMOTE_ACCESS = 'CONNECT__REMOTE_ACCESS',
    /** System customization and theming */
    CUSTOMIZATIONS = 'CUSTOMIZATIONS',
    /** Dashboard and system overview */
    DASHBOARD = 'DASHBOARD',
    /** Individual disk operations and management */
    DISK = 'DISK',
    /** Display and UI settings */
    DISPLAY = 'DISPLAY',
    /** Docker container management */
    DOCKER = 'DOCKER',
    /** Flash drive operations and settings */
    FLASH = 'FLASH',
    /** System information and status */
    INFO = 'INFO',
    /** System logs and logging */
    LOGS = 'LOGS',
    /** Current user profile and settings */
    ME = 'ME',
    /** Network configuration and management */
    NETWORK = 'NETWORK',
    /** System notifications and alerts */
    NOTIFICATIONS = 'NOTIFICATIONS',
    /** Online services and connectivity */
    ONLINE = 'ONLINE',
    /** Operating system operations and updates */
    OS = 'OS',
    /** System ownership and licensing */
    OWNER = 'OWNER',
    /** Permission management and administration */
    PERMISSION = 'PERMISSION',
    /** System registration and activation */
    REGISTRATION = 'REGISTRATION',
    /** My Servers management and configuration */
    SERVERS = 'SERVERS',
    /** System services and daemons */
    SERVICES = 'SERVICES',
    /** File share management */
    SHARE = 'SHARE',
    /** System variables and environment */
    VARS = 'VARS',
    /** Virtual machine management */
    VMS = 'VMS',
    /** Welcome and onboarding features */
    WELCOME = 'WELCOME',
}

export enum Role {
    /** Full administrative access to all resources */
    ADMIN = 'ADMIN',
    /** Read access to all resources with remote access management */
    CONNECT = 'CONNECT',
    /** Basic read access to user profile only */
    GUEST = 'GUEST',
    /** Read-only access to all resources */
    VIEWER = 'VIEWER',
}

// Simple interfaces without decorators
export interface ApiKey {
    id: string;
    name: string;
    description?: string;
    roles?: Role[];
    permissions?: Permission[];
    createdAt: string;
}

export interface ApiKeyWithSecret extends ApiKey {
    key: string;
}

export interface Permission {
    resource: Resource;
    actions: AuthAction[];
}