import { z } from "zod";
import { access, constants, readFile } from "node:fs/promises";
import { Command } from "commander";
import { getStagingChangelogFromGit } from "../utils/changelog";

const safeParseEnvSchema = z.object({
  ci: z.boolean().optional(),
  baseUrl: z.string().url(),
  tag: z.string().optional(),
  txzSha256: z.string(),
  txzName: z.string(),
  localFileserverUrl: z.string().url().optional(),
  pluginVersion: z.string(),
  releaseNotesPath: z.string().optional(),
});

const pluginEnvSchema = safeParseEnvSchema.extend({
  releaseNotes: z.string().nonempty("Release notes are required"),
});

export type PluginEnv = z.infer<typeof pluginEnvSchema>;

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
    envArgs.releaseNotes = process.env.TEST === "true" ? "FAST_TEST_CHANGELOG" :  await getStagingChangelogFromGit(safeEnv);
  }
  console.log("Validating plugin environment:", envArgs);
  const validatedEnv = pluginEnvSchema.parse(envArgs);

  if (validatedEnv.tag) {
    console.warn("Tag is set, will generate a TAGGED build");
  }
  if (validatedEnv.localFileserverUrl) {
    console.warn("Local fileserver URL is set, will generate a local build");
  }

  return validatedEnv;
};

export const setupPluginEnv = async (argv: string[]): Promise<PluginEnv> => {
  // CLI setup for plugin environment
  const program = new Command();

  program
    .requiredOption("--plugin-version <version>", "Plugin Version")
    .requiredOption("--txz-sha256 <sha256>", "TXZ SHA256")
    .requiredOption("--txz-name <name>", "TXZ Name")
    .requiredOption("--base-url <url>", "Base URL")
    .option("--tag <tag>", "Tag")
    .option("--local-fileserver-url <url>", "Local File Server URL")
    .option("--release-notes-path <path>", "Path to release notes file")
    .option("--ci", "CI mode", process.env.CI === "true")
    .parse(argv);

  const options = program.opts();
  const env = await validatePluginEnv(options);
  console.log("Plugin environment setup successfully:", env);
  return env;
};
