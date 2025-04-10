// Deals with identifying and distinguishing configs and their implementation types.

/**
 * Creates a string token representation of the arguements. Pure function.
 *
 * @param configName - The name of the config.
 * @param implementationDetails - Additional specifiers. Joined with colons `:` to form the token.
 * @returns A colon-separated string
 */
export function makeConfigToken(configName: string, ...implementationDetails: string[]) {
    return [configName, ...implementationDetails].join(':');
}

export class ConfigRegistry {
    /** A map of config names to their implementation models. */
    private static configTypes = new Map<string, string>();

    static register(configName: string, configType: string) {
        this.configTypes.set(configName, configType);
    }

    static getConfigType(configName: string) {
        return this.configTypes.get(configName);
    }

    static getConfigToken(configName: string) {
        const configType = ConfigRegistry.getConfigType(configName) ?? '';
        return makeConfigToken(configName, configType);
    }
}
