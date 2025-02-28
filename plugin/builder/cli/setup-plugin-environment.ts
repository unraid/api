import { z } from "zod";
import { access, constants, readFile } from "node:fs/promises";
import { Command } from "commander";
import { getStagingChangelogFromGit } from "../utils/changelog";
import { createHash } from "node:crypto";
import {
  findTxzInDeployDir,
  getPluginVersionFromTxz,
  getTxzPath,
} from "../utils/paths";
import { getPluginVersion } from "../utils/date";

const safeParseEnvSchema = z.object({
  ci: z.boolean().optional(),
  baseUrl: z.string().url(),
  tag: z.string().optional().default(""),

  txzPath: z.string().refine((val) => val.endsWith(".txz"), {
    message: "TXZ Path must end with .txz",
  }),
  releaseNotesPath: z.string().optional(),
});

const pluginEnvSchema = safeParseEnvSchema.extend({
  releaseNotes: z.string().nonempty("Release notes are required"),
  txzSha256: z.string().refine((val) => val.length === 64, {
    message: "TXZ SHA256 must be 64 characters long",
  }),
  pluginVersion: z.string().regex(/^\d{4}\.\d{2}\.\d{2}\.\d{4}$/, {
    message: "Plugin version must be in the format YYYY.MM.DD.HHMM",
  }),
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
    envArgs.releaseNotes =
      process.env.TEST === "true"
        ? "FAST_TEST_CHANGELOG"
        : await getStagingChangelogFromGit(safeEnv);
  }

  if (safeEnv.txzPath) {
    await access(safeEnv.txzPath, constants.F_OK);
    console.log("Reading txz file from:", safeEnv.txzPath);
    const txzFile = await readFile(safeEnv.txzPath);
    if (!txzFile || txzFile.length === 0) {
      throw new Error(`TXZ Path is empty: ${safeEnv.txzPath}`);
    }
    const pluginVersion = getPluginVersionFromTxz(safeEnv.txzPath);
    envArgs.pluginVersion = pluginVersion;
    envArgs.txzSha256 = getSha256(txzFile);
  }

  const validatedEnv = pluginEnvSchema.parse(envArgs);

  if (validatedEnv.tag) {
    console.warn("Tag is set, will generate a TAGGED build");
  }

  return validatedEnv;
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
        : `http://${process.env.HOST_LAN_IP}:8080`
    )
    .option(
      "--txz-path <path>",
      "Path to built package, if a version is found the version on this package will be used as the plugin version",
      await findTxzInDeployDir(process.cwd())
    )
    .option(
      "--tag <tag>",
      "Tag (used for PR and staging builds)",
      process.env.TAG
    )
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
