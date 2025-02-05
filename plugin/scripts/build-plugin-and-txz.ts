import path from "path";
import { execSync } from "child_process";
import { cp, readFile, writeFile, mkdir, readdir } from "fs/promises";
import { join } from "path";
import { createHash } from "node:crypto";
import { $, cd, dotenv } from "zx";
import { z } from "zod";
import conventionalChangelog from "conventional-changelog";
import { escape as escapeHtml } from "html-sloppy-escaper";
import { parse } from "semver";
import { existsSync } from "fs";
import { format as formatDate } from "date-fns";

const envSchema = z.object({
  API_VERSION: z.string().refine((v) => {
    return parse(v) ?? false;
  }, "Must be a valid semver version"),
  API_SHA256: z.string().regex(/^[a-f0-9]{64}$/),
  PR: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), "Must be a valid PR number"),
  SKIP_SOURCE_VALIDATION: z
    .string()
    .optional()
    .default("false")
    .refine((v) => v === "true" || v === "false", "Must be true or false"),
});

type Env = z.infer<typeof envSchema>;

const validatedEnv = envSchema.parse(dotenv.config() as Env);

const pluginName = "dynamix.unraid.net" as const;
const startingDir = process.cwd();
const BASE_URLS = {
  STABLE: "https://stable.dl.unraid.net/unraid-api",
  PREVIEW: "https://preview.dl.unraid.net/unraid-api",
} as const;

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
  const sourceDir = path.join(startingDir, "source");
  if (!existsSync(sourceDir)) {
    throw new Error(`Source directory ${sourceDir} does not exist`);
  }
  // Validate existence of webcomponent files:
  // source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components
  const webcomponentDir = path.join(
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
};

const buildTxz = async (
  version: string
): Promise<{
  txzName: string;
  txzSha256: string;
}> => {
  if (validatedEnv.SKIP_SOURCE_VALIDATION !== "true") {
    await validateSourceDir();
  }
  const txzName = `${pluginName}-${version}.txz`;
  const txzPath = path.join(startingDir, "deploy/release/archive", txzName);
  const prePackDir = join(startingDir, "deploy/pre-pack");

  // Copy all files from source to temp dir, excluding specific files
  await cp(join(startingDir, "source/dynamix.unraid.net"), prePackDir, {
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

  return { txzSha256: sha256, txzName };
};

const getStagingChangelogFromGit = async (
  apiVersion: string,
  pr: string | null = null
): Promise<string | null> => {
  console.debug("Getting changelog from git" + (pr ? " for PR" : ""));
  try {
    const changelogStream = conventionalChangelog(
      {
        preset: "conventionalcommits",
      },
      {
        version: apiVersion,
      },
      pr
        ? {
            from: "origin/main",
            to: "HEAD",
          }
        : {},
      undefined,
      pr
        ? {
            headerPartial: `## [PR #${pr}](https://github.com/unraid/api/pull/${pr})\n\n`,
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
  pr = "",
  apiVersion,
  apiSha256,
}: {
  type: "staging" | "pr" | "production";
  txzSha256: string;
  txzName: string;
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
      PLUGIN_URL = `${BASE_URLS.STABLE}/${pluginName}.plg`;
      MAIN_TXZ = `${BASE_URLS.STABLE}/${txzName}`;
      API_TGZ = `${BASE_URLS.STABLE}/unraid-api-${apiVersion}.tgz`;
      break;
    case "pr":
      PLUGIN_URL = `${BASE_URLS.PREVIEW}/pr/${pr}/${pluginName}.plg`;
      MAIN_TXZ = `${BASE_URLS.PREVIEW}/pr/${pr}/${txzName}`;
      API_TGZ = `${BASE_URLS.PREVIEW}/pr/${pr}/unraid-api-${apiVersion}.tgz`;
      RELEASE_NOTES = await getStagingChangelogFromGit(apiVersion, pr);
      break;
    case "staging":
      PLUGIN_URL = `${BASE_URLS.PREVIEW}/${pluginName}.plg`;
      MAIN_TXZ = `${BASE_URLS.PREVIEW}/${txzName}`;
      API_TGZ = `${BASE_URLS.PREVIEW}/unraid-api-${apiVersion}.tgz`;
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
  const { API_VERSION, API_SHA256, PR } = validatedEnv;
  await buildPlugin({
    type: "staging",
    txzSha256,
    txzName,
    version,
    apiVersion: API_VERSION,
    apiSha256: API_SHA256,
  });
  if (PR) {
    await buildPlugin({
      type: "pr",
      txzSha256,
      txzName,
      version,
      pr: PR,
      apiVersion: API_VERSION,
      apiSha256: API_SHA256,
    });
  }
  await buildPlugin({
    type: "production",
    txzSha256,
    txzName,
    version,
    apiVersion: API_VERSION,
    apiSha256: API_SHA256,
  });
};

await main();
