import { z } from "zod";
import { access, constants, readFile } from "node:fs/promises";
import { Command } from "commander";
import { getStagingChangelogFromGit } from "../utils/changelog";
import { createHash } from "node:crypto";
import { getTxzPath } from "../utils/paths";
import { existsSync } from "node:fs";
import { join } from "node:path";

const safeParseEnvSchema = z.object({
  ci: z.boolean().optional(),
  baseUrl: z.string().url(),
  tag: z.string().optional().default(''),
  apiVersion: z.string(),
  txzPath: z.string().refine((val) => val.endsWith(".txz"), {
    message: "TXZ Path must end with .txz",
  }),
  pluginVersion: z.string().regex(/^\d{4}\.\d{2}\.\d{2}\.\d{4}$/, {
    message: "Plugin version must be in the format YYYY.MM.DD.HHMM",
  }),
  releaseNotesPath: z.string().optional(),
});

const pluginEnvSchema = safeParseEnvSchema.extend({
  releaseNotes: z.string().nonempty("Release notes are required"),
  txzSha256: z.string().refine((val) => val.length === 64, {
    message: "TXZ SHA256 must be 64 characters long",
  }),
  apiVersion: z.string().nonempty("API version is required"),
});

export type PluginEnv = z.infer<typeof pluginEnvSchema>;

/**
 * Resolves the txz path, trying multiple possible locations based on apiVersion
 * Also verifies the file exists and is accessible
 * @param txzPath Initial txz path to check
 * @param apiVersion API version to use for alternative path
 * @param isCi Whether we're running in CI
 * @returns Object containing the resolved txz path and SHA256 hash
 * @throws Error if no valid txz file can be found
 */
export const resolveTxzPath = async (txzPath: string, apiVersion: string, isCi?: boolean): Promise<{path: string, sha256: string}> => {
  if (existsSync(txzPath)) {
    await access(txzPath, constants.F_OK);
    console.log("Reading txz file from:", txzPath);
    const txzFile = await readFile(txzPath);
    if (!txzFile || txzFile.length === 0) {
      throw new Error(`TXZ file is empty: ${txzPath}`);
    }
    return {
      path: txzPath,
      sha256: getSha256(txzFile)
    };
  }

  console.log(`TXZ path not found at: ${txzPath}`);
  console.log(`Attempting to find TXZ using apiVersion: ${apiVersion}`);
  
  // Try different formats of generated TXZ name
  const deployDir = join(process.cwd(), "deploy");
  
  // Try with exact apiVersion format
  const alternativePaths = [
    join(deployDir, `dynamix.unraid.net-${apiVersion}-x86_64-1.txz`),
  ];
  
  // In CI, we sometimes see unusual filenames, so try a glob-like approach
  if (isCi) {
    console.log("Checking for possible TXZ files in deploy directory");
    
    try {
      // Using node's filesystem APIs to scan the directory
      const fs = require('fs');
      const deployFiles = fs.readdirSync(deployDir);
      
      // Find any txz file that contains the apiVersion
      for (const file of deployFiles) {
        if (file.endsWith('.txz') && 
            file.includes('dynamix.unraid.net') && 
            file.includes(apiVersion.split('+')[0])) {
          alternativePaths.push(join(deployDir, file));
        }
      }
    } catch (error) {
      console.log(`Error scanning deploy directory: ${error}`);
    }
  }
  
  // Check each path
  for (const path of alternativePaths) {
    if (existsSync(path)) {
      console.log(`Found TXZ at: ${path}`);
      await access(path, constants.F_OK);
      console.log("Reading txz file from:", path);
      const txzFile = await readFile(path);
      if (!txzFile || txzFile.length === 0) {
        console.log(`TXZ file is empty: ${path}, trying next alternative`);
        continue;
      }
      return {
        path,
        sha256: getSha256(txzFile)
      };
    }
    console.log(`Could not find TXZ at: ${path}`);
  }
  
  // If we get here, we couldn't find a valid txz file
  throw new Error(`Could not find any valid TXZ file. Tried original path: ${txzPath} and alternatives.`);
};

export const validatePluginEnv = async (
  envArgs: Record<string, any>
): Promise<PluginEnv> => {
  const safeEnv = safeParseEnvSchema.parse(envArgs);
  if (safeEnv.releaseNotesPath) {
    await access(safeEnv.releaseNotesPath, constants.F_OK);
    const releaseNotes = await readFile(safeEnv.releaseNotesPath, "utf8");
    if (!releaseNotes || releaseNotes.length === 0) {
      throw new Error(
        `Release notes file is empty: ${safeEnv.releaseNotesPath}`
      );
    }
    envArgs.releaseNotes = releaseNotes;
  } else {
    envArgs.releaseNotes =
      process.env.TEST === "true"
        ? "FAST_TEST_CHANGELOG"
        : await getStagingChangelogFromGit(safeEnv);
  }

  // Resolve and validate the txz path
  const { path, sha256 } = await resolveTxzPath(safeEnv.txzPath, safeEnv.apiVersion, safeEnv.ci);
  envArgs.txzPath = path;
  envArgs.txzSha256 = sha256;

  const validatedEnv = pluginEnvSchema.parse(envArgs);

  if (validatedEnv.tag) {
    console.warn("Tag is set, will generate a TAGGED build");
  }

  return validatedEnv;
};

export const getPluginVersion = () => {
  const now = new Date();
  
  const formatUtcComponent = (component: number) => String(component).padStart(2, '0');

  const year = now.getUTCFullYear();
  const month = formatUtcComponent(now.getUTCMonth() + 1);
  const day = formatUtcComponent(now.getUTCDate());
  const hour = formatUtcComponent(now.getUTCHours());
  const minute = formatUtcComponent(now.getUTCMinutes());

  const version = `${year}.${month}.${day}.${hour}${minute}`;
  console.log("Plugin version:", version);
  return version;
};

export const setupPluginEnv = async (argv: string[]): Promise<PluginEnv> => {
  // CLI setup for plugin environment
  const program = new Command();

  program
    .requiredOption(
      "--base-url <url>",
      "Base URL - will be used to determine the bucket, and combined with the tag (if set) to form the final URL",
      process.env.CI === "true"
        ? "This is a CI build, please set the base URL manually"
        : `http://${process.env.HOST_LAN_IP}:5858`
    )
    .option(
      "--txz-path <path>",
      "Path to built package, will be used to generate the SHA256 and renamed with the plugin version",
      getTxzPath({ startingDir: process.cwd(), pluginVersion: process.env.API_VERSION })
    )
    .option(
      "--plugin-version <version>",
      "Plugin Version in the format YYYY.MM.DD.HHMM",
      getPluginVersion()
    )
    .requiredOption(
      "--api-version <version>",
      "API Version (e.g. 1.0.0)",
      process.env.API_VERSION
    )
    .option("--tag <tag>", "Tag (used for PR and staging builds)", process.env.TAG)
    .option("--release-notes-path <path>", "Path to release notes file")
    .option("--ci", "CI mode", process.env.CI === "true")
    .parse(argv);

  const options = program.opts();
  console.log("Options:", options);
  const env = await validatePluginEnv(options);
  console.log("Plugin environment setup successfully:", env);
  return env;
};

function getSha256(txzBlob: Buffer): string {
  return createHash("sha256").update(txzBlob).digest("hex");
}
