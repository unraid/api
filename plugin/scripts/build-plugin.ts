import { execSync } from "child_process";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { $ } from "zx";
import conventionalChangelog from "conventional-changelog";
import { escape as escapeHtml } from "html-sloppy-escaper";
import { setupEnvironment } from "./setup-plugin-environment";
import { dirname } from "node:path";
import { getTxzName, pluginName, pluginNameWithExt, startingDir } from "./consts";
import { getPluginUrl } from "./bucket-urls";
import { getMainTxzUrl } from "./bucket-urls";
import { getDeployPluginPath, getRootPluginPath, getTxzPath } from "./paths";
import { createHash } from "node:crypto";

// Setup environment variables
// Ensure that git is available

try {
  await $`git log -1 --pretty=%B`;
} catch (err) {
  console.error(`Error: git not available: ${err}`);
  process.exit(1);
}

const createPluginDirectory = async () => {
  await execSync(`rm -rf deploy/release/*`);
  await mkdir("deploy/release/plugins", { recursive: true });
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

const getStagingChangelogFromGit = async (
  pluginVersion: string,
  tag: string | null = null
): Promise<string> => {
  try {
    const changelogStream = conventionalChangelog(
      {
        preset: "conventionalcommits",
      },
      {
        version: pluginVersion,
      },
      tag
        ? {
            from: "origin/main",
            to: "HEAD",
          }
        : {},
      undefined,
      tag
        ? {
            headerPartial: `## [${tag}](https://github.com/unraid/api/${tag})\n\n`,
          }
        : undefined
    );
    let changelog = "";
    for await (const chunk of changelogStream) {
      changelog += chunk;
    }
    // Encode HTML entities using the 'he' library
    return changelog ?? "";
  } catch (err) {
    console.error(`Error: failed to get changelog from git: ${err}`);
    process.exit(1);
  }
};

const buildPlugin = async ({
  baseUrl,
  txzSha256,
  pluginVersion,
  releaseNotes,
  tag = "",
}: {
  baseUrl: string;
  txzSha256: string;
  pluginVersion: string;
  releaseNotes: string;
  tag?: string;
}) => {
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

const getSha256 = async (path: string) => {
  const hash = createHash("sha256").update(await readFile(path)).digest("hex");
  return hash;
};

const getTxzInfo = async () => {
  const txzPath = getTxzPath({ startingDir });
  const txzSha256 = await getSha256(txzPath);
  return { txzSha256, txzName: getTxzName() };
};

/**
 * Main build script
 */

const main = async () => {

  const validatedEnv = await setupEnvironment("plugin");

  const { BASE_URL, TAG, RELEASE_NOTES } = validatedEnv;

  const { txzSha256, txzName } = await getTxzInfo();
  const releaseNotes =
    RELEASE_NOTES ?? (await getStagingChangelogFromGit(PLUGIN_VERSION, TAG));
  await buildPlugin({
    baseUrl: BASE_URL,
    txzSha256: TXZ_SHA256,
    pluginVersion: PLUGIN_VERSION,
    releaseNotes,
  });
};

await main();
