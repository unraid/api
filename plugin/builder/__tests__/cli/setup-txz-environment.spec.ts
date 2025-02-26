import {
  setupTxzEnv,
  validateTxzEnv,
  TxzEnv,
} from "../../cli/setup-txz-environment";
import { describe, it, expect, vi } from "vitest";

describe("setupTxzEnvironment", () => {
  it("should return default values when no arguments are provided", async () => {
    const envArgs = {};
    const expected: TxzEnv = { CI: false, SKIP_VALIDATION: "false" };

    const result = await validateTxzEnv(envArgs);

    expect(result).toEqual(expected);
  });

  it("should parse and return provided environment arguments", async () => {
    const envArgs = { CI: true, SKIP_VALIDATION: "true" };
    const expected: TxzEnv = { CI: true, SKIP_VALIDATION: "true" };

    const result = await validateTxzEnv(envArgs);

    expect(result).toEqual(expected);
  });

  it("should warn and skip validation when SKIP_VALIDATION is true", async () => {
    const envArgs = { SKIP_VALIDATION: "true" };
    const consoleWarnSpy = vi
      .spyOn(console, "warn")
      .mockImplementation(() => {});

    await validateTxzEnv(envArgs);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      "SKIP_VALIDATION is true, skipping validation"
    );
    consoleWarnSpy.mockRestore();
  });

  it("should wait for 1 second when CI is false", async () => {
    const envArgs = { CI: false };
    const waitSpy = vi.spyOn(global, "setTimeout");

    await validateTxzEnv(envArgs);

    expect(waitSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
    waitSpy.mockRestore();
  });

  it("should not wait when CI is true", async () => {
    const envArgs = { CI: true };
    const waitSpy = vi.spyOn(global, "setTimeout");

    await validateTxzEnv(envArgs);

    expect(waitSpy).not.toHaveBeenCalled();
    waitSpy.mockRestore();
  });

  it("should throw an error for invalid SKIP_VALIDATION value", async () => {
    const envArgs = { SKIP_VALIDATION: "invalid" };

    await expect(validateTxzEnv(envArgs)).rejects.toThrow(
      "Must be true or false"
    );
  });
});
