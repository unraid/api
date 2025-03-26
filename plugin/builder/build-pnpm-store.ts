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

/**
 * The name of the pnpm store archive that will be vendored with the plugin.
 * @returns The name of the pnpm store bundle file
 */
export function getPnpmBundleName(): string {
    const version = getVersion();
    return `pnpm-store-for-v${version}.txz`;
}

/**
 * Prepare a versioned bundle of the API's pnpm store to vendor dependencies.
 * 
 * It expects a generic `packed-pnpm-store.txz` archive to be available in the `startingDir`.
 * It copies this archive to the `deployDir` directory and adds a version to the filename.
 * It does not actually create the packed pnpm store archive; that is done inside the API's build script.
 * 
 * After this operation, the vendored store will be available inside the `deployDir`.
 */
export async function bundlePnpmStore(): Promise<void> {
    const storeArchive = join(startingDir, "packed-pnpm-store.txz");
    const pnpmStoreTarPath = join(deployDir, getPnpmBundleName());
    await copyFile(storeArchive, pnpmStoreTarPath);
}
