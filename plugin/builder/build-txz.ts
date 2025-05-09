import { join } from "path";
import { $, cd } from "zx";
import { existsSync } from "node:fs";
import { readdir, writeFile } from "node:fs/promises";
import { getTxzName, pluginName, startingDir } from "./utils/consts";
import { ensureNodeJs } from "./utils/nodejs-helper";

import { setupTxzEnv, TxzEnv } from "./cli/setup-txz-environment";
import { cleanupTxzFiles } from "./utils/cleanup";
import { apiDir } from "./utils/paths";
import { getVendorBundleName, getVendorFullPath } from "./build-vendor-store";
import { getAssetUrl } from "./utils/bucket-urls";


// Recursively search for manifest files
const findManifestFiles = async (dir: string): Promise<string[]> => {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        try {
          files.push(...(await findManifestFiles(fullPath)));
        } catch (error) {
          // Log and continue if a subdirectory can't be read
          console.warn(`Warning: Could not read directory ${fullPath}: ${error.message}`);
        }
      } else if (
        entry.isFile() &&
        (entry.name === "manifest.json" || entry.name === "ui.manifest.json")
      ) {
        files.push(entry.name);
      }
    }

    return files;
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`Directory does not exist: ${dir}`);
      return [];
    }
    throw error; // Re-throw other errors
  }
};

// Function to store vendor archive information in a recoverable location
const storeVendorArchiveInfo = async (version: string, vendorUrl: string, vendorFilename: string) => {
  try {
    if (!version || !vendorUrl || !vendorFilename) {
      throw new Error("Cannot store vendor archive info: Missing required parameters");
    }
    
    // Create a config directory in the source tree
    const configDir = join(
      startingDir,
      "source",
      "dynamix.unraid.net",
      "usr",
      "local",
      "share",
      "dynamix.unraid.net",
      "config"
    );
    
    // Ensure directory exists
    await $`mkdir -p ${configDir}`;
    
    // Get the full path for vendor archive
    const vendorFullPath = getVendorFullPath(version);
    
    // Create a JSON config file with vendor information
    const configData = {
      vendor_store_url: vendorUrl,
      vendor_store_path: vendorFullPath,
      api_version: version
    };
    
    // Validate all fields are present
    Object.entries(configData).forEach(([key, value]) => {
      if (!value) {
        throw new Error(`Cannot store vendor archive info: Missing value for ${key}`);
      }
    });
    
    const configPath = join(configDir, "vendor_archive.json");
    await writeFile(configPath, JSON.stringify(configData, null, 2));
    
    console.log(`Vendor archive information stored in ${configPath}`);
    console.log(`API Version: ${version}`);
    console.log(`Vendor URL: ${vendorUrl}`);
    console.log(`Vendor Full Path: ${vendorFullPath}`);
    return true;
  } catch (error) {
    console.error(`Failed to store vendor archive information: ${error.message}`);
    throw error; // Re-throw to prevent build from succeeding with invalid vendor info
  }
};

const validateSourceDir = async (validatedEnv: TxzEnv) => {
  if (!validatedEnv.ci) {
    console.log("Validating TXZ source directory");
  }
  const sourceDir = join(startingDir, "source");
  if (!existsSync(sourceDir)) {
    throw new Error(`Source directory ${sourceDir} does not exist`);
  }
  // Validate existence of webcomponent files:
  // source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components
  const webcomponentDir = join(
    sourceDir,
    "dynamix.unraid.net",
    "usr",
    "local",
    "emhttp",
    "plugins",
    "dynamix.my.servers",
    "unraid-components"
  );
  if (!existsSync(webcomponentDir)) {
    throw new Error(`Webcomponent directory ${webcomponentDir} does not exist`);
  }

  const manifestFiles = await findManifestFiles(webcomponentDir);
  const hasManifest = manifestFiles.includes("manifest.json");
  const hasUiManifest = manifestFiles.includes("ui.manifest.json");

  if (!hasManifest || !hasUiManifest) {
    console.log("Existing Manifest Files:", manifestFiles);
    const missingFiles: string[] = [];
    if (!hasManifest) missingFiles.push("manifest.json");
    if (!hasUiManifest) missingFiles.push("ui.manifest.json");
    
    throw new Error(
      `Webcomponents missing required file(s): ${missingFiles.join(", ")} - ` +
      `${!hasUiManifest ? "run 'pnpm build:wc' in unraid-ui for ui.manifest.json" : ""}` +
      `${!hasManifest && !hasUiManifest ? " and " : ""}` +
      `${!hasManifest ? "run 'pnpm build' in web for manifest.json" : ""}`
    );
  }

  if (!existsSync(apiDir)) {
    throw new Error(`API directory ${apiDir} does not exist`);
  }
  const packageJson = join(apiDir, "package.json");
  if (!existsSync(packageJson)) {
    throw new Error(`API package.json file ${packageJson} does not exist`);
  }
  // Now CHMOD the api/dist directory files to allow execution
  await $`chmod +x ${apiDir}/dist/*.js`;
};

const buildTxz = async (validatedEnv: TxzEnv) => {
  await validateSourceDir(validatedEnv);
  
  // Use version from validated environment
  const version = validatedEnv.apiVersion;
  
  // Always use version when getting txz name
  const txzName = getTxzName(version);
  console.log(`Package name: ${txzName}`);
  const txzPath = join(validatedEnv.txzOutputDir, txzName);
  
  // Use the getVendorBundleName function for consistent naming
  const vendorFilename = getVendorBundleName(version);
  // Use the baseUrl and tag from validatedEnv, consistent with build-plugin.ts
  const vendorUrl = getAssetUrl({ 
    baseUrl: validatedEnv.baseUrl, 
    tag: validatedEnv.tag
  }, vendorFilename);
  
  console.log(`Storing vendor archive information: ${vendorUrl} -> ${vendorFilename}`);
  await storeVendorArchiveInfo(version, vendorUrl, vendorFilename);
  
  await ensureNodeJs();

  // Create package - must be run from within the pre-pack directory
  // Use cd option to run command from prePackDir
  await cd(join(startingDir, "source", pluginName));
  $.verbose = true;

  // Create the package using the default package name
  await $`${join(startingDir, "scripts/makepkg")} --chown y --compress -${
    validatedEnv.compress
  } --linkadd n ${txzPath}`;
  $.verbose = false;
  await cd(startingDir);
};

const main = async () => {
  try {
    const validatedEnv = await setupTxzEnv(process.argv);
    await cleanupTxzFiles();
    await buildTxz(validatedEnv);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

await main();
