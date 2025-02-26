import { z } from "zod";
import { access, constants, readFile } from "node:fs/promises";
import { Command } from "commander";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const pluginEnvSchema = z.object({
  ci: z.boolean().optional().default(false),
  baseUrl: z.string().url(),
  tag: z.string().optional(),
  txzSha256: z.string(),
  txzName: z.string(),
  localFileserverUrl: z.string().url().optional(),
  releaseNotesPath: z.string().optional(),
  releaseNotes: z.string().optional(),
  pluginVersion: z.string(),
});

type PluginEnv = z.infer<typeof pluginEnvSchema>;

export const validatePluginEnv = async (
  envArgs: Record<string, any>
): Promise<PluginEnv> => {
  console.log("Validating plugin environment:", envArgs);
  const validatedEnv = pluginEnvSchema.parse(envArgs);

  let shouldWait = false;
  if (validatedEnv.tag) {
    console.warn("Tag is set, will generate a TAGGED build");
    shouldWait = true;
  }
  if (validatedEnv.localFileserverUrl) {
    console.warn("Local fileserver URL is set, will generate a local build");
    shouldWait = true;
  }

  if (validatedEnv.releaseNotesPath) {
    const notesPath = validatedEnv.releaseNotesPath;
    if (notesPath) {
      await access(notesPath, constants.F_OK);
      const releaseNotes = await readFile(notesPath, "utf8");
      if (!releaseNotes || releaseNotes.length === 0) {
        throw new Error(
          `Release notes file is empty: ${validatedEnv.releaseNotesPath}`
        );
      }
      validatedEnv.releaseNotes = releaseNotes;
    }
  }

  if (shouldWait && !validatedEnv.ci) {
    await wait(1000);
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
    .option("--release-notes-path <path>", "Release Notes Path")
    .option("--ci", "CI mode", process.env.CI === "true")
    .parse(argv);

  const options = program.opts();
  const env = await validatePluginEnv(options);
  console.log("Plugin environment setup successfully:", env);
  return env;
};