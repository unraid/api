import { readFile } from "fs/promises";
import { join } from "path";
import { z } from "zod";
import { parse } from "semver";
import { dotenv } from "zx";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sharedEnvSchema = z.object({
  API_VERSION: z.string().refine((v) => {
    return parse(v) ?? false;
  }, "Must be a valid semver version"),
  TAG: z.string().optional(),
  CI: z.boolean().optional().default(false),
});

const txzEnvSchema = sharedEnvSchema.extend({
  SKIP_VALIDATION: z
    .string()
    .optional()
    .default("false")
    .refine((v) => v === "true" || v === "false", "Must be true or false"),

});

const pluginEnvSchema = sharedEnvSchema.extend({
  PLUGIN_URL: z.string().url(),
  TXZ_SHA256: z.string(),
  TXZ_NAME: z.string(),
  LOCAL_FILESERVER_URL: z.string().url().optional(),
});

const getLocalEnvironmentVariablesFromApiFolder = async (startingDir: string): Promise<
  Partial<PluginEnv>
> => {
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

type PluginEnv = z.infer<typeof pluginEnvSchema>;
type TxzEnv = z.infer<typeof txzEnvSchema>;

type SchemaType = "plugin" | "txz";
type EnvType<T extends SchemaType> = T extends "plugin" ? PluginEnv : TxzEnv;

function getSchema(type: SchemaType) {
  return type === "plugin" ? pluginEnvSchema : txzEnvSchema;
}

function isTxzEnv(env: TxzEnv | PluginEnv): env is TxzEnv {
  return 'SKIP_VALIDATION' in env;
}

export const setupEnvironment = async <T extends SchemaType>(
  startingDir: string,
  schemaType: T
): Promise<EnvType<T>> => {
  const schema = getSchema(schemaType);
  const validatedEnv = schema.parse(
    {
      ...process.env,
      ...(await dotenv.config()),
      ...(schemaType === "plugin" ? await getLocalEnvironmentVariablesFromApiFolder(startingDir) : {}),
    }
  ) as EnvType<T>;
  let shouldWait = false;

  if (schemaType === "txz" && isTxzEnv(validatedEnv)) {
    if (validatedEnv.SKIP_VALIDATION === "true") {
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
  }

  console.log("validatedEnv", validatedEnv);

  if (shouldWait) {
    await wait(1000);
  }

  return validatedEnv;
};
