import { execSync } from "node:child_process";

export const cleanupTxzFiles = async () => {
  await execSync(`rm -rf deploy/*.txz`);
};

export const cleanupPluginFiles = async () => {
  await execSync(`rm -rf deploy/*.plg`);
}