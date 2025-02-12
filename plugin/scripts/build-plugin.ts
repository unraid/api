import { execSync } from "child_process";
import { cp, readFile, writeFile, mkdir, readdir } from "fs/promises";
import { basename, join } from "path";
import { createHash } from "node:crypto";
import { $, cd } from "zx";
import conventionalChangelog from "conventional-changelog";
import { escape as escapeHtml } from "html-sloppy-escaper";
import { existsSync } from "fs";
import { format as formatDate } from "date-fns";
import { setupEnvironment } from "./setup-plugin-environment";
import { dirname } from "node:path";
const pluginName = "dynamix.unraid.net" as const;
const startingDir = process.cwd();

const validatedEnv = await setupEnvironment(startingDir, "plugin");

const BASE_URLS = {
  STABLE: "https://stable.dl.unraid.net/unraid-api",
  PREVIEW: "https://preview.dl.unraid.net/unraid-api",
  ...(validatedEnv.LOCAL_FILESERVER_URL
    ? { LOCAL: validatedEnv.LOCAL_FILESERVER_URL }
    : {}),
} as const;

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
  apiVersion: string,
  tag: string | null = null
): Promise<string | null> => {
  if (!validatedEnv.CI) {
    console.debug("Getting changelog from git" + (tag ? " for TAG" : ""));
  }
  try {
    const changelogStream = conventionalChangelog(
      {
        preset: "conventionalcommits",
      },
      {
        version: apiVersion,
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
    return escapeHtml(changelog) ?? null;
  } catch (err) {
    console.error(`Error: failed to get changelog from git: ${err}`);
    process.exit(1);
  }
};

const buildPlugin = async ({
  type,
  txzSha256,
  txzName,
  version,
  tag = "",
  apiVersion,
}: {
  type: "staging" | "pr" | "production" | "local";
  txzSha256: string;
  txzName: string;
  version: string;
  tag?: string;
  apiVersion: string;
}) => {
  const rootPlgFile = join(startingDir, "/plugins/", `${pluginName}.plg`);
  // Set up paths
  const newPluginFile = join(
    startingDir,
    "/deploy/release/plugins/",
    type,
    `${pluginName}.plg`
  );

  // Define URLs
  let PLUGIN_URL = "";
  let MAIN_TXZ = "";
  let RELEASE_NOTES: string | null = null;
  switch (type) {
    case "production":
      PLUGIN_URL = `${BASE_URLS.STABLE}/${pluginName}.plg`;
      MAIN_TXZ = `${BASE_URLS.STABLE}/${txzName}`;
      break;
    case "pr":
      PLUGIN_URL = `${BASE_URLS.PREVIEW}/tag/${tag}/${pluginName}.plg`;
      MAIN_TXZ = `${BASE_URLS.PREVIEW}/tag/${tag}/${txzName}`;
      RELEASE_NOTES = await getStagingChangelogFromGit(apiVersion, tag);
      break;
    case "staging":
      PLUGIN_URL = `${BASE_URLS.PREVIEW}/${pluginName}.plg`;
      MAIN_TXZ = `${BASE_URLS.PREVIEW}/${txzName}`;
      RELEASE_NOTES = await getStagingChangelogFromGit(apiVersion);
      break;
    case "local":
      PLUGIN_URL = `${BASE_URLS.LOCAL}/plugins/${type}/${pluginName}.plg`;
      MAIN_TXZ = `${BASE_URLS.LOCAL}/archive/${txzName}`;
      RELEASE_NOTES = await getStagingChangelogFromGit(apiVersion, tag);
      break;
  }

  // Update plg file
  let plgContent = await readFile(rootPlgFile, "utf8");

  // Update entity values
  const entities: Record<string, string> = {
    name: pluginName,
    env: type === "pr" ? "staging" : type,
    version: version,
    pluginURL: PLUGIN_URL,
    SHA256: txzSha256,
    MAIN_TXZ: MAIN_TXZ,
    TAG: tag,
    API_version: apiVersion,
  };

  // Iterate over entities and update them
  Object.entries(entities).forEach(([key, value]) => {
    if (key !== "TAG" && !value) {
      throw new Error(`Entity ${key} not set in entities : ${value}`);
    }
    plgContent = updateEntityValue(plgContent, key, value);
  });

  if (RELEASE_NOTES) {
    // Update the CHANGES section with release notes
    plgContent = plgContent.replace(
      /<CHANGES>.*?<\/CHANGES>/s,
      `<CHANGES>\n${RELEASE_NOTES}\n</CHANGES>`
    );
  }

  await mkdir(dirname(newPluginFile), { recursive: true });
  await writeFile(newPluginFile, plgContent);
  if (!validatedEnv.CI) {
    console.log(`${type} plugin: ${newPluginFile}`);
  }
};

/**
 * Main build script
 */

const main = async () => {
  await createBuildDirectory();
  const { API_VERSION, TAG, LOCAL_FILESERVER_URL } = validatedEnv;

  if (LOCAL_FILESERVER_URL) {
    await buildPlugin({
      type: "local",
      txzSha256,
      txzName,
      version,
      tag: TAG,
      apiVersion: API_VERSION,
    });
  } else if (TAG) {
    await buildPlugin({
      type: "pr",
      txzSha256,
      txzName,
      version,
      tag: TAG,
      apiVersion: API_VERSION,
    });
  }

  await buildPlugin({
    type: "staging",
    txzSha256,
    txzName,
    version,
    apiVersion: API_VERSION,
  });
  await buildPlugin({
    type: "production",
    txzSha256,
    txzName,
    version,
    apiVersion: API_VERSION,
  });
  
  console.log()
};

await main();
