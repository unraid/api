export const pluginName = "dynamix.unraid.net" as const;
export const pluginNameWithExt = `${pluginName}.plg` as const;

export const getTxzName = (version?: string) =>
  version ? `${pluginName}-${version}.txz` : `${pluginName}.txz`;
export const startingDir = process.cwd();

export const BASE_URLS = {
  STABLE: "https://stable.dl.unraid.net/unraid-api",
  PREVIEW: "https://preview.dl.unraid.net/unraid-api",
} as const;
