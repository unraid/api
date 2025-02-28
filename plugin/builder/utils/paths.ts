import { join } from "path";
import { getTxzName, pluginNameWithExt } from "./consts";
import { readdir } from "fs/promises";

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

export const findTxzInDeployDir = async (startingDir: string): Promise<string | undefined> => {
  const txzDir = join(startingDir, deployDir);
  const txzFiles = await readdir(txzDir);
  const txzFile = txzFiles.find((file) => file.endsWith(".txz"));
  if (!txzFile) {
    throw new Error(`No TXZ file found in ${txzDir}`);
  }
  return join(txzDir, txzFile);
};

export const getPluginVersionFromTxz = (txzPath: string): string => {
  const txzFileName = txzPath.split('/').pop() || '';
  const match = txzFileName.match(/.*-(\d{4}\.\d{2}\.\d{2}\.\d{4})\.txz$/);
  if (!match) {
    throw new Error(`Invalid TXZ filename format: ${txzFileName}`);
  }
  const version = match[1];
  console.log("Plugin version from TXZ:", version);
  return version;
};
