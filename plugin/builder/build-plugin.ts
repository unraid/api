import { readFile, writeFile, mkdir } from "fs/promises";
import { $ } from "zx";
import { escape as escapeHtml } from "html-sloppy-escaper";
import { dirname } from "node:path";
import { pluginName, startingDir } from "./utils/consts";
import { getPluginUrl } from "./utils/bucket-urls";
import { getMainTxzUrl } from "./utils/bucket-urls";
import {
  getDeployPluginPath,
  getRootPluginPath,
} from "./utils/paths";
import { PluginEnv, setupPluginEnv } from "./cli/setup-plugin-environment";

/**
 * Check if git is available
 */
const checkGit = async () => {
  try {
    await $`git log -1 --pretty=%B`;
  } catch (err) {
    console.error(`Error: git not available: ${err}`);
    process.exit(1);
  }
};

function updateEntityValue(
  xmlString: string,
  entityName: string,
  newValue: string
) {
  const regex = new RegExp(`<!ENTITY ${entityName} "[^"]*">`);
  if (regex.test(xmlString)) {
    return xmlString.replace(regex, `<!ENTITY ${entityName} "${newValue}">`);
  }
  throw new Error(`Entity ${entityName} not found in XML`);
}

const buildPlugin = async ({
  pluginVersion,
  baseUrl,
  tag = "",
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
    SHA256: txzSha256,
    TAG: tag,
  };

  // Iterate over entities and update them
  Object.entries(entities).forEach(([key, value]) => {
    if (key !== "TAG" && !value) {
      throw new Error(`Entity ${key} not set in entities : ${value}`);
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
  await writeFile(getDeployPluginPath({ startingDir }), plgContent);
};

/**
 * Main build script
 */

const main = async () => {
  await checkGit();
  const validatedEnv = await setupPluginEnv(process.argv);
  await buildPlugin(validatedEnv);
};

await main();
