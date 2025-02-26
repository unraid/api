import { join } from "path";
import { validateTxzEnv, TxzEnv } from "../../cli/setup-txz-environment";
import { describe, it, expect, vi } from "vitest";
import { startingDir } from "../../utils/consts";

describe("setupTxzEnvironment", () => {
  it("should return default values when no arguments are provided", async () => {
    const envArgs = {};
    const expected: TxzEnv = { ci: false, skipValidation: "false", compress: "1", txzOutputDir: join(startingDir, "deploy/release/archive") };

    const result = await validateTxzEnv(envArgs);

    expect(result).toEqual(expected);
  });

  it("should parse and return provided environment arguments", async () => {
    const envArgs = { ci: true, skipValidation: "true", txzOutputDir: join(startingDir, "deploy/release/test"), compress: '8' };
    const expected: TxzEnv = { ci: true, skipValidation: "true", compress: "8", txzOutputDir: join(startingDir, "deploy/release/test") };

    const result = await validateTxzEnv(envArgs);

    expect(result).toEqual(expected);
  });

  it("should warn and skip validation when skipValidation is true", async () => {
    const envArgs = { skipValidation: "true" };
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    await validateTxzEnv(envArgs);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "skipValidation is true, skipping validation"
    );
    consoleWarnSpy.mockRestore();
  });

  it("should throw an error for invalid SKIP_VALIDATION value", async () => {
    const envArgs = { skipValidation: "invalid" };

    await expect(validateTxzEnv(envArgs)).rejects.toThrow(
      "Must be true or false"
    );
  });
});
