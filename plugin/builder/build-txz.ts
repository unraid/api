import { dirname, join } from "path";
import { tmpdir } from "os";
import { $, cd } from "zx";
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { getTxzName, pluginName, startingDir } from "./utils/consts";
import { ensureNodeJs } from "./utils/nodejs-helper";

import { setupTxzEnv, TxzEnv } from "./cli/setup-txz-environment";
import { cleanupTxzFiles } from "./utils/cleanup";
import { getVendorBundleName, getVendorFullPath } from "./build-vendor-store";
import { getAssetUrl } from "./utils/bucket-urls";
import { validateStandaloneManifest, getStandaloneManifestPath } from "./utils/manifest-validator";

const mountedAssetsDir = join(startingDir, ".mounted-assets");
const mountedUuiDir = join(mountedAssetsDir, "uui");
const mountedStandaloneDir = join(mountedAssetsDir, "standalone");
const hostSourceDir = join(startingDir, "source");
const buildRootDir = join(tmpdir(), "connect-plugin-build");
const buildSourceDir = join(buildRootDir, "source");
const buildPluginDir = join(buildSourceDir, pluginName);
const buildWebcomponentsDir = join(
  buildSourceDir,
  "dynamix.unraid.net",
  "usr",
  "local",
  "emhttp",
  "plugins",
  "dynamix.my.servers",
  "unraid-components"
);
const buildApiDir = join(buildPluginDir, "usr", "local", "unraid-api");

const prepareBuildSourceDir = async () => {
  await rm(buildRootDir, { force: true, recursive: true });
  await mkdir(buildRootDir, { recursive: true });
  await cp(hostSourceDir, buildSourceDir, { force: true, recursive: true });
};

const syncMountedAssetDir = async ({
  sourceDir,
  targetDir,
  label,
}: {
  sourceDir: string;
  targetDir: string;
  label: string;
}) => {
  if (!existsSync(sourceDir)) {
    return;
  }

  await rm(targetDir, { force: true, recursive: true });
  await mkdir(dirname(targetDir), { recursive: true });
  await cp(sourceDir, targetDir, { force: true, recursive: true });
  console.log(`Synced ${label}: ${sourceDir} -> ${targetDir}`);
};

const syncMountedAssets = async () => {
  await syncMountedAssetDir({
    sourceDir: mountedUuiDir,
    targetDir: join(buildWebcomponentsDir, "uui"),
    label: "web components",
  });
  await syncMountedAssetDir({
    sourceDir: mountedStandaloneDir,
    targetDir: join(buildWebcomponentsDir, "standalone"),
    label: "standalone assets",
  });
};

// Check for manifest files in expected locations
const findManifestFiles = async (dir: string): Promise<string[]> => {
  const files: string[] = [];
  
  // Check standalone subdirectory (preferred)
  try {
    const standaloneDir = join(dir, "standalone");
    const entries = await readdir(standaloneDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name === "standalone.manifest.json") {
        files.push("standalone/standalone.manifest.json");
      }
    }
  } catch (error) {
    // Directory doesn't exist, continue checking other locations
  }
  
  // Check root directory for backwards compatibility
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isFile() && entry.name === "standalone.manifest.json") {
        files.push("standalone.manifest.json");
      }
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.warn(`Directory does not exist: ${dir}`);
      return [];
    }
    throw error; // Re-throw other errors
  }
  
  return files;
};

// Function to store vendor archive information in a recoverable location
const storeVendorArchiveInfo = async (version: string, vendorUrl: string, vendorFilename: string) => {
  try {
    if (!version || !vendorUrl || !vendorFilename) {
      throw new Error("Cannot store vendor archive info: Missing required parameters");
    }
    
    // Create a config directory in the source tree
    const configDir = join(
      buildSourceDir,
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
      // vendor_store_url: vendorUrl,
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
  if (!existsSync(hostSourceDir)) {
    throw new Error(`Source directory ${hostSourceDir} does not exist`);
  }
  await prepareBuildSourceDir();
  await syncMountedAssets();

  if (!existsSync(buildWebcomponentsDir)) {
    throw new Error(
      `Webcomponent directory ${buildWebcomponentsDir} does not exist`
    );
  }

  const manifestFiles = await findManifestFiles(buildWebcomponentsDir);
  const hasStandaloneManifest = manifestFiles.some(file => 
    file === "standalone.manifest.json" || file === "standalone/standalone.manifest.json"
  );

  // Only require standalone.manifest.json for new standalone apps
  if (!hasStandaloneManifest) {
    console.log("Existing Manifest Files:", manifestFiles);
    throw new Error(
      `Webcomponents missing required file: standalone.manifest.json - ` +
      `run 'pnpm build' in web to generate standalone.manifest.json in the standalone/ subdirectory`
    );
  }
  
  // Validate the manifest contents
  const manifestPath = getStandaloneManifestPath(buildWebcomponentsDir);
  if (manifestPath) {
    const validation = await validateStandaloneManifest(manifestPath);
    
    if (!validation.isValid) {
      console.error("Standalone manifest validation failed:");
      validation.errors.forEach(error => console.error(`  ❌ ${error}`));
      if (validation.warnings.length > 0) {
        console.warn("Warnings:");
        validation.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
      }
      throw new Error("Standalone manifest validation failed. See errors above.");
    }
    
    if (validation.warnings.length > 0) {
      console.warn("Standalone manifest validation warnings:");
      validation.warnings.forEach(warning => console.warn(`  ⚠️  ${warning}`));
    }
    
    console.log("✅ Standalone manifest validation passed");
  }

  if (!existsSync(buildApiDir)) {
    throw new Error(`API directory ${buildApiDir} does not exist`);
  }
  const packageJson = join(buildApiDir, "package.json");
  if (!existsSync(packageJson)) {
    throw new Error(`API package.json file ${packageJson} does not exist`);
  }
  // Now CHMOD the api/dist directory files to allow execution
  await $`chmod +x ${buildApiDir}/dist/*.js`;
};

const buildTxz = async (validatedEnv: TxzEnv) => {
  await validateSourceDir(validatedEnv);
  
  // Use version from validated environment
  const version = validatedEnv.apiVersion;
  
  // Always use version when getting txz name
  const txzName = getTxzName({ version, build: validatedEnv.buildNumber.toString() });
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
  
  await Promise.all([
    ensureNodeJs(),
  ]);

  // Create package - must be run from within the pre-pack directory
  // Use cd option to run command from prePackDir
  await cd(buildPluginDir);
  $.verbose = true;

  // Create the package using the default package name
  await $`${join(startingDir, "scripts/makepkg")} --chown y --compress -${
    validatedEnv.compress
  } --linkadd y ${txzPath}`;
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
