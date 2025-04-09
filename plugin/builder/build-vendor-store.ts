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
 * The name of the node_modules archive that will be vendored with the plugin.
 * @returns The name of the node_modules bundle file
 */
export function getVendorBundleName(): string {
    const version = getVersion();
    return `node_modules-for-v${version}.tar.xz`;
}

/**
 * Prepare a versioned bundle of the API's node_modules to vendor dependencies.
 * 
 * It expects a generic `packed-node-modules.tar.xz` archive to be available in the `startingDir`.
 * It copies this archive to the `deployDir` directory and adds a version to the filename.
 * It does not actually create the packed node_modules archive; that is done inside the API's build script.
 * 
 * After this operation, the vendored node_modules will be available inside the `deployDir`.
 */
export async function bundleVendorStore(): Promise<void> {
    const storeArchive = join(startingDir, "packed-node-modules.tar.xz");
    const vendorStoreTarPath = join(deployDir, getVendorBundleName());
    await copyFile(storeArchive, vendorStoreTarPath);
}
