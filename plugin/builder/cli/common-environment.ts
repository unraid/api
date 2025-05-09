import { Command } from "commander";
import { z } from "zod";

/**
 * Common base environment fields shared between different build setups
 */
export const baseEnvSchema = z.object({
  ci: z.boolean().optional().default(false),
  apiVersion: z.string(),
  baseUrl: z.string().url(),
  tag: z.string().optional().default(''),
});

export type BaseEnv = z.infer<typeof baseEnvSchema>;

/**
 * Generate a default base URL for local development
 */
export const getDefaultBaseUrl = (): string => {
  return process.env.CI === "true"
    ? "This is a CI build, please set the base URL manually"
    : `http://${process.env.HOST_LAN_IP || 'localhost'}:5858`;
};

/**
 * Common CLI options shared across different command setups
 */
export const addCommonOptions = (program: Command) => {
  return program
    .option("--ci", "CI mode", process.env.CI === "true")
    .requiredOption("--api-version <version>", "API version", process.env.API_VERSION)
    .requiredOption(
      "--base-url <url>",
      "Base URL for assets",
      getDefaultBaseUrl()
    )
    .option("--tag <tag>", "Tag (used for PR and staging builds)", process.env.TAG);
}; 