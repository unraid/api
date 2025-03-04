import { join } from "path";
import { getTxzName, pluginNameWithExt } from "./consts";

export interface PathConfig {
  startingDir: string;
}

export interface TxzPathConfig extends PathConfig {
  pluginVersion?: string;
}

export const deployDir = "deploy" as const;

/**
 * Get the path to the root plugin directory
 * @param startingDir - The starting directory
 * @returns The path to the root plugin directory
 */
export function getRootPluginPath({ startingDir }: PathConfig): string {
  return join(startingDir, "/plugins/", pluginNameWithExt);
}

/**
 * Get the path to the deploy plugin directory
 * @param startingDir - The starting directory
 * @returns The path to the deploy plugin directory
 */
export function getDeployPluginPath({ startingDir }: PathConfig): string {
  return join(startingDir, deployDir, pluginNameWithExt);
}

/**
 * Get the path to the TXZ file
 * @param startingDir - The starting directory
 * @param pluginVersion - The plugin version
 * @returns The path to the TXZ file
 */
export function getTxzPath({
  startingDir,
  pluginVersion,
}: TxzPathConfig): string {
  return join(startingDir, deployDir, getTxzName(pluginVersion));
}
