import { readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import { parse } from "semver";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const envSchema = z.object({
  API_VERSION: z.string().refine((v) => {
    return parse(v) ?? false;
  }, "Must be a valid semver version"),
  TAG: z
    .string()
    .refine((v) => v ? /^[a-zA-Z0-9]+$/.test(v) : true, "Tag must contain only alphanumeric characters")
    .optional(),
  SKIP_VALIDATION: z
    .string()
    .optional()
    .default("false")
    .refine((v) => v === "true" || v === "false", "Must be true or false"),
  LOCAL_FILESERVER_URL: z.string().url().optional(),
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
  let shouldWait = false;

  if (validatedEnv.SKIP_VALIDATION == "true") {
    console.warn("SKIP_VALIDATION is true, skipping validation");
    shouldWait = true;
  }

  if (validatedEnv.TAG) {
    console.warn("TAG is set, will generate a TAGGED build");
    shouldWait = true;
  }

  if (validatedEnv.LOCAL_FILESERVER_URL) {
    console.warn("LOCAL_FILESERVER_URL is set, will generate a local build");
    shouldWait = true;
  }

  if (shouldWait) {
    await wait(1000);
  }

  return validatedEnv;
};
