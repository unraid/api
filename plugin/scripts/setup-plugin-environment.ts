import { z } from "zod";
import { dotenv } from "zx";
import { access, constants, readFile } from "node:fs/promises";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const ENV = z.enum(["PRODUCTION", "STAGING"]);
export type Env = Zod.infer<typeof ENV>;

const sharedEnvSchema = z.object({
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
  BASE_URL: z.string().url(),
  TAG: z.string().optional(),
  ENV,
  TXZ_SHA256: z.string(),
  TXZ_NAME: z.string(),
  LOCAL_FILESERVER_URL: z.string().url().optional(),
  RELEASE_NOTES_PATH: z.string().optional(),
  RELEASE_NOTES: z.string().optional(),
});

type PluginEnv = z.infer<typeof pluginEnvSchema>;
type TxzEnv = z.infer<typeof txzEnvSchema>;

type SchemaType = "plugin" | "txz";
type EnvType<T extends SchemaType> = T extends "plugin" ? PluginEnv : TxzEnv;

function getSchema(type: SchemaType) {
  return type === "plugin" ? pluginEnvSchema : txzEnvSchema;
}

export const setupEnvironment = async <T extends SchemaType>(
  schemaType: T
): Promise<EnvType<T>> => {
  const schema = getSchema(schemaType);
  const validatedEnv = schema.parse({
    ...process.env,
    ...(await dotenv.config()),
  }) as EnvType<T>;

  let shouldWait = false;
  if ("TAG" in validatedEnv) {
    console.warn("TAG is set, will generate a TAGGED build");
    shouldWait = true;
  }
  if ("LOCAL_FILESERVER_URL" in validatedEnv) {
    console.warn("LOCAL_FILESERVER_URL is set, will generate a local build");
    shouldWait = true;
  }
  if ("SKIP_VALIDATION" in validatedEnv) {
    console.warn("SKIP_VALIDATION is true, skipping validation");
    shouldWait = true;
  }

  if ("RELEASE_NOTES_PATH" in validatedEnv) {
    // Validate the file exists with content and fail if it doesn't
    const notesPath = validatedEnv.RELEASE_NOTES_PATH;
    if (notesPath) {
      await access(notesPath, constants.F_OK);
      const releaseNotes = await readFile(notesPath, "utf8");
      if (!releaseNotes || releaseNotes.length === 0) {
        throw new Error(
          `RELEASE_NOTES_PATH file is empty: ${validatedEnv.RELEASE_NOTES_PATH}`
        );
      }
      validatedEnv.RELEASE_NOTES = releaseNotes;
    }
  }

  if (shouldWait && !validatedEnv.CI) {
    await wait(1000);
  }

  return validatedEnv;
};
