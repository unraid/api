import type { ZodType } from "zod";

/**
 * Container record of config names to their types. Used for type completion on registered configs.
 * Config authors should redeclare/merge this interface with their config names as the keys 
 * and implementation models as the types.
 */
export interface ConfigFeatures {};


export interface ConfigMetadata {
    /** Unique token for this config. Used for Dependency Injection, logging, etc. */
    token: string;
    /** The name of the config. Used for logging and dependency injection. */
    configName: string;
    /** The path to the config file. */
    filePath?: string;
    /** The zod schema for the config. */
    schema: ZodType;
}
