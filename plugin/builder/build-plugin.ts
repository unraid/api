import { readFile, writeFile, mkdir, rename } from "fs/promises";
import { $ } from "zx";
import { escape as escapeHtml } from "html-sloppy-escaper";
import { dirname, join } from "node:path";
import { getTxzName, pluginName, startingDir } from "./utils/consts";
import { getPluginUrl } from "./utils/bucket-urls";
import { getMainTxzUrl } from "./utils/bucket-urls";
import {
  deployDir,
  getDeployPluginPath,
  getRootPluginPath,
} from "./utils/paths";
import { PluginEnv, setupPluginEnv } from "./cli/setup-plugin-environment";
import { cleanupPluginFiles } from "./utils/cleanup";

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

const moveTxzFile = async (txzPath: string, pluginVersion: string) => {
  const txzName = getTxzName(pluginVersion);
  await rename(txzPath, join(deployDir, txzName));
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
}: PluginEnv) => {
  // Update plg file
  let plgContent = await readFile(getRootPluginPath({ startingDir }), "utf8");

  // Update entity values
  const entities: Record<string, string> = {
    name: pluginName,
    version: pluginVersion,
    pluginURL: getPluginUrl({ baseUrl, tag }),
    MAIN_TXZ: getMainTxzUrl({ baseUrl, pluginVersion, tag }),
    TXZ_SHA256: txzSha256,
    ...(tag ? { TAG: tag } : {}),
  };

  console.log("Entities:", entities);
  // Iterate over entities and update them
  Object.entries(entities).forEach(([key, value]) => {
    if (!value) {
      throw new Error(`Entity ${key} not set in entities: ${JSON.stringify(entities)}`);
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
    await checkGit();
    await cleanupPluginFiles();

    await buildPlugin(validatedEnv);
    await moveTxzFile(validatedEnv.txzPath, validatedEnv.pluginVersion);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

await main();
