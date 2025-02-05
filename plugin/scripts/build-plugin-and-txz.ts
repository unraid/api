import path from "path";
import { execSync } from "child_process";
import { cp, readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { createHash } from "node:crypto";
import { $, cd, dotenv } from "zx";
import { z } from "zod";
import conventionalChangelog from "conventional-changelog";

const envSchema = z.object({
  API_VERSION: z.string(),
  API_SHA256: z.string(),
  PR: z.string().optional(),
});

type Env = z.infer<typeof envSchema>;
const env = dotenv.config() as Env;
const validatedEnv = envSchema.parse(env);

const pluginName = "dynamix.unraid.net" as const;
const startingDir = process.cwd();

// Ensure that git is available
await $`git log -1 --pretty=%B`;

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

const buildTxz = async (): Promise<{
  sha256: string;
  txzPath: string;
  version: string;
}> => {
  const version = new Date()
    .toISOString()
    .replace(/[-:]/g, ".")
    .slice(0, 16)
    .replace("T", ".");
  const txzPath = path.join(
    startingDir,
    "deploy/release/archive",
    `${pluginName}-${version}.txz`
  );
  const prePackDir = join(startingDir, "deploy/pre-pack");

  // Copy all files from source to temp dir, excluding specific files
  await cp("source/dynamix.unraid.net", prePackDir, {
    recursive: true,
    filter: (src) => {
      const filename = path.basename(src);
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

  await $`${join(startingDir, "scripts/makepkg")} -l y -c y "${txzPath}"`;
  $.verbose = false;
  await cd(startingDir);

  // Calculate hashes
  const sha256 = createHash("sha256")
    .update(await readFile(txzPath))
    .digest("hex");
  console.log(`TXZ SHA256: ${sha256}`);

  try {
    await $`${join(startingDir, "scripts/explodepkg")} "${txzPath}"`;
  } catch (err) {
    console.error(`Error: invalid txz package created: ${txzPath}`);
    process.exit(1);
  }

  return { sha256, txzPath, version };
};

const getStagingChangelogFromGit = async (
  apiVersion: string
): Promise<string | null> => {
  try {
    const changelogStream = conventionalChangelog(
      {
        preset: "conventionalcommits",
      },
      {
        version: apiVersion,
      }
    );
    let changelog = "";
    for await (const chunk of changelogStream) {
      changelog += chunk;
    }
    return changelog;
  } catch (err) {
    console.error(`Error: failed to get changelog from git: ${err}`);
    return null;
  }
};

const buildPlugin = async ({
  type,
  txzSha256,
  version,
  pr = "",
  apiVersion,
  apiSha256,
}: {
  type: "staging" | "pr" | "production";
  txzSha256: string;
  version: string;
  pr?: string;
  apiVersion: string;
  apiSha256: string;
}) => {
  const rootPlgFile = path.join(startingDir, "/plugins/", `${pluginName}.plg`);
  // Set up paths
  const newPluginFile = path.join(
    startingDir,
    "/deploy/release/plugins/",
    `${pluginName}${type === "production" ? "" : `.${type}`}.plg`
  );

  // Define URLs
  let PLUGIN_URL = "";
  let MAIN_TXZ = "";
  let API_TGZ = "";
  let RELEASE_NOTES: string | null = null;
  switch (type) {
    case "production":
      PLUGIN_URL = "https://stable.dl.unraid.net/unraid-api/&name;.plg";
      MAIN_TXZ = `https://stable.dl.unraid.net/unraid-api/${pluginName}-${version}.txz`;
      API_TGZ = `https://stable.dl.unraid.net/unraid-api/unraid-api-${process.env.API_VERSION}.tgz`;
      break;
    case "pr":
      MAIN_TXZ = `https://preview.dl.unraid.net/unraid-api/pr/${pr}/${pluginName}-${version}.txz`;
      API_TGZ = `https://preview.dl.unraid.net/unraid-api/pr/${pr}/unraid-api-${process.env.API_VERSION}.tgz`;
      PLUGIN_URL = `https://preview.dl.unraid.net/unraid-api/pr/${pr}/${pluginName}.plg`;
      RELEASE_NOTES = await getStagingChangelogFromGit(apiVersion);
      break;
    case "staging":
      PLUGIN_URL = "https://stable.dl.unraid.net/unraid-api/&name;.plg";
      MAIN_TXZ = `https://preview.dl.unraid.net/unraid-api/${pluginName}-${version}.txz`;
      API_TGZ = `https://preview.dl.unraid.net/unraid-api/unraid-api-${process.env.API_VERSION}.tgz`;
      RELEASE_NOTES = await getStagingChangelogFromGit(apiVersion);
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
    API_TGZ: API_TGZ,
    PR: pr,
    API_version: apiVersion,
    API_SHA256: apiSha256,
  };

  // Iterate over entities and update them
  Object.entries(entities).forEach(([key, value]) => {
    if (key !== "PR" && !value) {
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

  await writeFile(newPluginFile, plgContent);
  console.log(`${entities.env} plugin: ${newPluginFile}`);
};

/**
 * Main build script
 */

const main = async () => {
  await createBuildDirectory();
  const { sha256: txzSha256, version } = await buildTxz();
  const { API_VERSION, API_SHA256, PR } = validatedEnv;
  await buildPlugin({
    type: "staging",
    txzSha256,
    version,
    apiVersion: API_VERSION,
    apiSha256: API_SHA256,
  });
  if (PR) {
    await buildPlugin({
      type: "pr",
      txzSha256,
      version,
      pr: PR,
      apiVersion: API_VERSION,
      apiSha256: API_SHA256,
    });
  }
  await buildPlugin({
    type: "production",
    txzSha256,
    version,
    apiVersion: API_VERSION,
    apiSha256: API_SHA256,
  });
};

await main();
