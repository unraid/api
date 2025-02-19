import { execSync } from "child_process";
import { cp, readFile, writeFile, mkdir, readdir } from "fs/promises";
import { basename, join } from "path";
import { createHash } from "node:crypto";
import { $, cd } from "zx";
import conventionalChangelog from "conventional-changelog";
import { escape as escapeHtml } from "html-sloppy-escaper";
import { existsSync } from "fs";
import { format as formatDate } from "date-fns";
import { setupEnvironment } from "./setup-environment";
import { dirname } from "node:path";
const pluginName = "dynamix.unraid.net" as const;
const startingDir = process.cwd();

const validatedEnv = await setupEnvironment(startingDir);

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

const createBuildDirectory = async () => {
  await execSync(`rm -rf deploy/pre-pack/*`);
  await execSync(`rm -rf deploy/release/*`);
  await execSync(`rm -rf deploy/test/*`);
  await mkdir("deploy/pre-pack", { recursive: true });
  await mkdir("deploy/release/plugins", { recursive: true });
  await mkdir("deploy/release/archive", { recursive: true });
  await mkdir("deploy/test", { recursive: true });
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

const validateSourceDir = async () => {
  console.log("Validating TXZ source directory");
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
  // Validate that there are webcomponents
  const webcomponents = await readdir(webcomponentDir);
  if (webcomponents.length === 1 && webcomponents[0] === ".gitkeep") {
    throw new Error(`No webcomponents found in ${webcomponentDir}`);
  }
  // Check for the existence of "ui.manifest.json" as well as "manifest.json" in webcomponents
  if (
    !webcomponents.includes("ui.manifest.json") ||
    !webcomponents.includes("manifest.json")
  ) {
    throw new Error(
      `Webcomponents must contain both "ui.manifest.json" and "manifest.json"`
    );
  }

  const apiDir = join(
    startingDir,
    "source/dynamix.unraid.net/usr/local/unraid-api/package.json"
  );
  if (!existsSync(apiDir)) {
    throw new Error(`API directory ${apiDir} does not exist`);
  }
};

const buildTxz = async (
  version: string
): Promise<{
  txzName: string;
  txzSha256: string;
}> => {
  if (
    validatedEnv.SKIP_VALIDATION !== "true" ||
    validatedEnv.LOCAL_FILESERVER_URL
  ) {
    await validateSourceDir();
  }

  const txzName = `${pluginName}-${version}.txz`;
  const txzPath = join(startingDir, "deploy/release/archive", txzName);
  const prePackDir = join(startingDir, "deploy/pre-pack");

  // Copy all files from source to temp dir, excluding specific files
  await cp(join(startingDir, "source/dynamix.unraid.net"), prePackDir, {
    recursive: true,
    filter: (src) => {
      const filename = basename(src);
      return ![
        ".DS_Store",
        "pkg_build.sh",
        "makepkg",
        "explodepkg",
        "sftp-config.json",
        ".gitkeep",
      ].includes(filename);
    },
  });

  // Create package - must be run from within the pre-pack directory
  // Use cd option to run command from prePackDir
  await cd(prePackDir);
  $.verbose = true;

  await $`${join(
    startingDir,
    "scripts/makepkg"
  )} -l n -c y --compress -1 "${txzPath}"`;
  $.verbose = false;
  await cd(startingDir);

  // Calculate hashes
  const sha256 = createHash("sha256")
    .update(await readFile(txzPath))
    .digest("hex");
  console.log(`TXZ SHA256: ${sha256}`);

  if (validatedEnv.SKIP_VALIDATION !== "true") {
    try {
      await $`${join(startingDir, "scripts/explodepkg")} "${txzPath}"`;
    } catch (err) {
      console.error(`Error: invalid txz package created: ${txzPath}`);
      process.exit(1);
    }
  }

  return { txzSha256: sha256, txzName };
};

const getStagingChangelogFromGit = async (
  apiVersion: string,
  tag: string | null = null
): Promise<string | null> => {
  console.debug("Getting changelog from git" + (tag ? " for TAG" : ""));
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
  console.log(`${type} plugin: ${newPluginFile}`);
};

/**
 * Main build script
 */

const main = async () => {
  await createBuildDirectory();

  const version = formatDate(new Date(), "yyyy.MM.dd.HHmm");
  console.log(`Version: ${version}`);
  const { txzSha256, txzName } = await buildTxz(version);
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
};

await main();
