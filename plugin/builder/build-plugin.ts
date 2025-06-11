import { readFile, writeFile, mkdir, rename } from "fs/promises";
import { $ } from "zx";
import { escape as escapeHtml } from "html-sloppy-escaper";
import { dirname, join } from "node:path";
import { getTxzName, pluginName, startingDir, defaultArch, defaultBuild } from "./utils/consts";
import { getAssetUrl, getPluginUrl } from "./utils/bucket-urls";
import { getMainTxzUrl } from "./utils/bucket-urls";
import {
  deployDir,
  getDeployPluginPath,
  getRootPluginPath,
} from "./utils/paths";
import { PluginEnv, setupPluginEnv } from "./cli/setup-plugin-environment";
import { cleanupPluginFiles } from "./utils/cleanup";
import { bundleVendorStore, getVendorBundleName } from "./build-vendor-store";

/**
 * Check if git is available
 */
const checkGit = async () => {
  try {
    await $`git log -1 --pretty=%B`;
  } catch (err) {
    console.error(`Error: git not available: ${err}`);
    throw new Error(`Git not available: ${err}`);
  }
};

const moveTxzFile = async ({txzPath, apiVersion}: Pick<PluginEnv, "txzPath" | "apiVersion">) => {
  const txzName = getTxzName(apiVersion);
  const targetPath = join(deployDir, txzName);
  
  // Ensure the txz always has the full version name
  if (txzPath !== targetPath) {
    console.log(`Ensuring TXZ has correct name: ${txzPath} -> ${targetPath}`);
    await rename(txzPath, targetPath);
  } else {
    console.log(`TXZ file already has correct name: ${txzPath}`);
  }
};

function updateEntityValue(
  xmlString: string,
  entityName: string,
  newValue: string
) {
  console.log("Updating entity:", entityName, "with value:", newValue);
  const regex = new RegExp(`<!ENTITY ${entityName} "[^"]*">`);
  if (regex.test(xmlString)) {
    return xmlString.replace(regex, `<!ENTITY ${entityName} "${newValue}">`);
  }
  throw new Error(`Entity ${entityName} not found in XML`);
}

const buildPlugin = async ({
  pluginVersion,
  baseUrl,
  tag,
  txzSha256,
  releaseNotes,
  apiVersion,
}: PluginEnv) => {
  console.log(`API version: ${apiVersion}`);
  
  // Update plg file
  let plgContent = await readFile(getRootPluginPath({ startingDir }), "utf8");

  // Update entity values
  const entities: Record<string, string> = {
    name: pluginName,
    version: pluginVersion,
    api_version: apiVersion,
    arch: defaultArch,
    build: defaultBuild,
    plugin_url: getPluginUrl({ baseUrl, tag }),
    txz_url: getMainTxzUrl({ baseUrl, apiVersion, tag }),
    txz_sha256: txzSha256,
    txz_name: getTxzName(apiVersion),
    // vendor_store_url: getAssetUrl({ baseUrl, tag }, getVendorBundleName(apiVersion)),
    vendor_store_filename: getVendorBundleName(apiVersion),
    ...(tag ? { tag } : {}),
  };

  console.log("Entities:", entities);
  // Iterate over entities and update them
  Object.entries(entities).forEach(([key, value]) => {
    if (!value) {
      throw new Error(
        `Entity ${key} not set in entities: ${JSON.stringify(entities)}`
      );
    }
    plgContent = updateEntityValue(plgContent, key, value);
  });

  if (releaseNotes) {
    // Update the CHANGES section with release notes
    plgContent = plgContent.replace(
      /<CHANGES>.*?<\/CHANGES>/s,
      `<CHANGES>\n${escapeHtml(releaseNotes)}\n</CHANGES>`
    );
  }

  await mkdir(dirname(getDeployPluginPath({ startingDir })), {
    recursive: true,
  });
  console.log("Writing plg file to:", getDeployPluginPath({ startingDir }));
  await writeFile(getDeployPluginPath({ startingDir }), plgContent);
};

/**
 * Main build script
 */

const main = async () => {
  try {
    const validatedEnv = await setupPluginEnv(process.argv);
    if (validatedEnv.tag === "LOCAL_PLUGIN_BUILD") {
      console.log("Skipping git check for LOCAL_PLUGIN_BUILD");
    } else {
      await checkGit();
    }
    await cleanupPluginFiles();

    await buildPlugin(validatedEnv);
    await moveTxzFile(validatedEnv);
    await bundleVendorStore(validatedEnv.apiVersion);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

await main();
