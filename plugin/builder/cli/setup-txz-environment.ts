import { join } from "path";
import { z } from "zod";
import { Command } from "commander";
import { startingDir } from "../utils/consts";
import { deployDir } from "../utils/paths";

const txzEnvSchema = z.object({
  ci: z.boolean().optional().default(false),
  skipValidation: z
    .string()
    .optional()
    .default("false")
    .refine((v) => v === "true" || v === "false", "Must be true or false"),
  compress: z.string().optional().default("1"),
  txzOutputDir: z.string().optional().default(join(startingDir, deployDir)),
});

export type TxzEnv = z.infer<typeof txzEnvSchema>;

export const validateTxzEnv = async (
  envArgs: Record<string, any>
): Promise<TxzEnv> => {
  const validatedEnv = txzEnvSchema.parse(envArgs);

  if ("skipValidation" in validatedEnv) {
    console.warn("skipValidation is true, skipping validation");
  }

  return validatedEnv;
};

export const setupTxzEnv = async (argv: string[]): Promise<TxzEnv> => {
  // CLI setup for TXZ environment
  const program = new Command();

  program
    .option("--skip-validation", "Skip validation", "false")
    .option("--ci", "CI mode", process.env.CI === "true")
    .option("--compress, -z", "Compress level", "1")

    .parse(argv);

  const options = program.opts();

  const env = await validateTxzEnv(options);
  console.log("TXZ environment setup successfully:", env);
  return env;
};
