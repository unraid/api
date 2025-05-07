export const pluginName = "dynamix.unraid.net" as const;
export const pluginNameWithExt = `${pluginName}.plg` as const;

// Default architecture and build number for Slackware package
export const defaultArch = "x86_64" as const;
export const defaultBuild = "1" as const;

// Get the txz name following Slackware naming convention: name-version-arch-build.txz
export const getTxzName = (version?: string, arch: string = defaultArch, build: string = defaultBuild) =>
  version ? `${pluginName}-${version}-${arch}-${build}.txz` : `${pluginName}.txz`;
export const startingDir = process.cwd();

export const BASE_URLS = {
  STABLE: "https://stable.dl.unraid.net/unraid-api",
  PREVIEW: "https://preview.dl.unraid.net/unraid-api",
} as const;

export const LOCAL_BUILD_TAG = "LOCAL_PLUGIN_BUILD" as const;