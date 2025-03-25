import { apiDir, deployDir } from "./utils/paths";
import { join } from "path";
import { readFileSync } from "node:fs";
import { startingDir } from "./utils/consts";
import { copyFile } from "node:fs/promises";

/**
 * Get the version of the API from the package.json file
 * 
 * Throws if package.json is not found or is invalid JSON.
 * @returns The version of the API
 */
function getVersion(): string {
    const packageJsonPath = join(apiDir, "package.json");
    const packageJsonString = readFileSync(packageJsonPath, "utf8");
    const packageJson = JSON.parse(packageJsonString);
    return packageJson.version;
}

export function getPnpmBundleName(): string {
    const version = getVersion();
    return `pnpm-store-for-v${version}.txz`;
}

export async function bundlePnpmStore(): Promise<void> {
    const storeArchive = join(startingDir, "packed-pnpm-store.txz");
    const pnpmStoreTarPath = join(deployDir, getPnpmBundleName());
    await copyFile(storeArchive, pnpmStoreTarPath);
}

