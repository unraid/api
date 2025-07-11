import { deployDir, vendorStorePath } from "./utils/paths";
import { join } from "path";
import { existsSync, mkdirSync } from "node:fs";
import { startingDir } from "./utils/consts";
import { copyFile, stat } from "node:fs/promises";
import { execSync } from "child_process";

/**
 * The name of the node_modules archive that will be vendored with the plugin.
 * @param version API version to use in the filename
 * @returns The name of the node_modules bundle file
 */
export function getVendorBundleName(version: string): string {
    return `node_modules-for-v${version}.tar.xz`;
}

/**
 * Get the full path where the vendor bundle should be stored
 * @param version API version to use in the filename
 * @returns The full path to the vendor bundle
 */
export function getVendorFullPath(version: string): string {
    return join(vendorStorePath, getVendorBundleName(version));
}

/**
 * Create a tarball of the node_modules for local development
 * @param outputPath Path to write the tarball to
 */
async function createNodeModulesTarball(outputPath: string): Promise<void> {
    console.log(`Creating node_modules tarball at ${outputPath}`);
    try {
        // Create a tarball of the node_modules directly from the API directory
        const apiNodeModules = join(process.cwd(), "..", "api", "node_modules");
        if (existsSync(apiNodeModules)) {
            console.log(`Found API node_modules at ${apiNodeModules}, creating tarball...`);
            execSync(`tar -cJf "${outputPath}" -C "${join(process.cwd(), "..", "api")}" node_modules`);
            console.log(`Successfully created node_modules tarball at ${outputPath}`);
            return;
        }
        throw new Error(`API node_modules not found at ${apiNodeModules}`);
    } catch (error) {
        console.error(`Failed to create node_modules tarball: ${error}`);
        throw error;
    }
}

/**
 * Prepare a versioned bundle of the API's node_modules to vendor dependencies.
 * 
 * It first tries to use the `packed-node-modules.tar.xz` from the mounted volume.
 * If that fails, it checks the parent API directory and tries to create a tarball from node_modules.
 * 
 * After this operation, the vendored node_modules will be available inside the `deployDir`.
 * 
 * @param apiVersion Required API version to use for the vendor bundle
 * @deprecated vendored node_modules are now included in the API slackware package
 */
export async function bundleVendorStore(apiVersion: string): Promise<void> {
    // Ensure deploy directory exists
    mkdirSync(deployDir, { recursive: true });
    
    const vendorStoreTarPath = join(deployDir, getVendorBundleName(apiVersion));
    
    // Possible locations for the node modules archive
    const possibleLocations = [
        join(startingDir, "node-modules-archive/packed-node-modules.tar.xz"),  // Docker mount
        join(process.cwd(), "..", "api", "deploy", "node-modules-archive", "packed-node-modules.tar.xz") // Direct path to API deploy
    ];
    
    let foundArchive = false;
    
    for (const archivePath of possibleLocations) {
        try {
            console.log(`Checking for vendor store at ${archivePath}`);
            if (!existsSync(archivePath)) {
                console.log(`Archive not found at ${archivePath}`);
                continue;
            }
            
            const stats = await stat(archivePath);
            if (!stats.isFile()) {
                console.log(`${archivePath} exists but is not a file`);
                continue;
            }
            
            console.log(`Copying vendor store from ${archivePath} to ${vendorStoreTarPath}`);
            await copyFile(archivePath, vendorStoreTarPath);
            console.log(`Successfully copied vendor store to ${vendorStoreTarPath}`);
            foundArchive = true;
            break;
        } catch (error) {
            console.log(`Error checking ${archivePath}: ${error}`);
        }
    }
    
    if (!foundArchive) {
        console.log("Could not find existing node_modules archive, attempting to create one");
        // Create a temporary archive in the deploy directory
        const tempArchivePath = join(deployDir, "temp-node-modules.tar.xz");
        await createNodeModulesTarball(tempArchivePath);
        await copyFile(tempArchivePath, vendorStoreTarPath);
    }
}
