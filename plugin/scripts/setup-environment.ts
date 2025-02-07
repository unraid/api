import { readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import { parse } from "semver";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const envSchema = z.object({
  API_VERSION: z.string().refine((v) => {
    return parse(v) ?? false;
  }, "Must be a valid semver version"),
  PR: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), "Must be a valid PR number"),
  SKIP_VALIDATION: z
    .string()
    .optional()
    .default("false")
    .refine((v) => v === "true" || v === "false", "Must be true or false"),
});

type Env = z.infer<typeof envSchema>;

export const setupEnvironment = async (
  startingDir: string
): Promise<Env> => {
  const getLocalEnvironmentVariablesFromApiFolder = async (): Promise<Partial<Env>> => {
    const apiDir = join(
      startingDir,
      "source/dynamix.unraid.net/usr/local/unraid-api"
    );
    const apiPackageJson = join(apiDir, "package.json");
    const apiPackageJsonContent = await readFile(apiPackageJson, "utf8");
    const apiPackageJsonObject = JSON.parse(apiPackageJsonContent);
    return {
      API_VERSION: apiPackageJsonObject.version,
    };
  };

  const validatedEnv = envSchema.parse(
    {
      ...process.env,
      ...(await getLocalEnvironmentVariablesFromApiFolder()),
    }
  );

  if (validatedEnv.SKIP_VALIDATION == "true") {
    console.warn("SKIP_VALIDATION is true, skipping validation");
    await wait(1000);
  }

  if (validatedEnv.PR) {
    console.warn("PR is set, will generate a PR build");
    await wait(1000);
  }

  return validatedEnv;
};
