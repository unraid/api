type DockerContainerNameSource =
    | {
          names?: string[] | null;
      }
    | {
          Names?: string[] | null;
      };

interface DockerContainerNameOptions {
    normalizeCase?: boolean;
    stripLeadingSlash?: boolean;
}

export function stripLeadingDockerSlash(name?: string | null): string | null {
    if (!name) {
        return null;
    }

    const strippedName = name.replace(/^\//, '');
    return strippedName || null;
}

export function getDockerContainerPrimaryName(
    container?: DockerContainerNameSource | null,
    options?: DockerContainerNameOptions
): string | null {
    if (!container) {
        return null;
    }

    const names = 'names' in container ? container.names : 'Names' in container ? container.Names : undefined;
    if (!Array.isArray(names) || names.length === 0) {
        return null;
    }

    const primaryName = options?.stripLeadingSlash === false ? names[0] ?? null : stripLeadingDockerSlash(names[0]);
    if (!primaryName) {
        return null;
    }

    return options?.normalizeCase ? primaryName.toLowerCase() : primaryName;
}

export function getNormalizedDockerContainerPrimaryName(
    container?: DockerContainerNameSource | null
): string | null {
    return getDockerContainerPrimaryName(container, { normalizeCase: true });
}
