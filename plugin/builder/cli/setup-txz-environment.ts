import { z } from "zod";
import { Command } from "commander";

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const txzEnvSchema = z.object({
  CI: z.boolean().optional().default(false),
  SKIP_VALIDATION: z
    .string()
    .optional()
    .default("false")
    .refine((v) => v === "true" || v === "false", "Must be true or false"),
});

export type TxzEnv = z.infer<typeof txzEnvSchema>;

export const validateTxzEnv = async (
  envArgs: Record<string, any>
): Promise<TxzEnv> => {
  const validatedEnv = txzEnvSchema.parse(envArgs);

  if ("SKIP_VALIDATION" in validatedEnv) {
    console.warn("SKIP_VALIDATION is true, skipping validation");
  }

  if (!validatedEnv.CI) {
    await wait(1000);
  }

  return validatedEnv;
};

export const setupTxzEnv = async (argv: string[]): Promise<TxzEnv> => {
  // CLI setup for TXZ environment
  const program = new Command();

  program
    .option("--skip-validation", "Skip validation", "false")
    .option("--ci", "CI mode", false)
    .parse(argv);

  const options = program.opts();

  const env = await validateTxzEnv(options);
  console.log("TXZ environment setup successfully:", env);
  return env;
};
