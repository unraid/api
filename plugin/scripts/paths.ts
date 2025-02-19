import { join } from "path";
import { getTxzName, pluginNameWithExt, txzNameWithoutVersion } from "./consts";

export interface PathConfig {
  startingDir: string;
}

export interface TxzPathConfig extends PathConfig {
  pluginVersion?: string;
}

export function getRootPluginPath({ startingDir }: PathConfig): string {
  return join(startingDir, "/plugins/", pluginNameWithExt);
}

export function getDeployPluginPath({ startingDir }: PathConfig): string {
  return join(startingDir, "/deploy/release/", pluginNameWithExt);
}

export function getTxzPath({
  startingDir,
  pluginVersion,
}: TxzPathConfig): string {
  return join(
    startingDir,
    "/deploy/release/archive/",
    getTxzName(pluginVersion)
  );
}
