/**
 * Container record of config names to their types. Used for type completion on registered configs.
 * Config authors should redeclare/merge this interface with their config names as the keys
 * and implementation models as the types.
 */
export interface ConfigFeatures {}

export interface ConfigMetadata<T = unknown> {
    /** Unique token for this config. Used for Dependency Injection, logging, etc. */
    token: string;
    /** The path to the config file. */
    filePath?: string;
    /** Synchronously validates a config of type `T`. */
    validate: (config: unknown) => T | void;
}
