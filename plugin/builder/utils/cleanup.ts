import { execSync } from "node:child_process";
import { deployDir } from "./paths";
import { mkdir } from "node:fs/promises";
import { startingDir } from "./consts";
import { join } from "node:path";

export const cleanupTxzFiles = async () => {
  await mkdir(deployDir, { recursive: true });
  const txzFiles = join(startingDir, deployDir, "*.txz");
  await execSync(`rm -rf ${txzFiles}`);
};

export const cleanupPluginFiles = async () => {
  await mkdir(deployDir, { recursive: true });
  const pluginFiles = join(startingDir, deployDir, "*.plg");
  await execSync(`rm -rf ${pluginFiles}`);
};

