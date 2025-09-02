import { join } from "path";
import { validateTxzEnv, TxzEnv } from "../../cli/setup-txz-environment";
import { describe, it, expect, vi } from "vitest";
import { startingDir } from "../../utils/consts";
import { deployDir } from "../../utils/paths";

describe("setupTxzEnvironment", () => {
  it("should return default values when no arguments are provided", async () => {
    const envArgs = {
      apiVersion: "4.17.0",
      baseUrl: "https://example.com"
    };
    const expected: TxzEnv = { 
      apiVersion: "4.17.0",
      baseUrl: "https://example.com",
      ci: false, 
      skipValidation: "false", 
      compress: "1", 
      txzOutputDir: join(startingDir, deployDir),
      tag: "",
      buildNumber: 1
    };

    const result = await validateTxzEnv(envArgs);

    expect(result).toEqual(expected);
  });

  it("should parse and return provided environment arguments", async () => {
    const envArgs = { 
      apiVersion: "4.17.0",
      baseUrl: "https://example.com",
      ci: true, 
      skipValidation: "true", 
      txzOutputDir: join(startingDir, "deploy/release/test"), 
      compress: '8' 
    };
    const expected: TxzEnv = { 
      apiVersion: "4.17.0",
      baseUrl: "https://example.com",
      ci: true, 
      skipValidation: "true", 
      compress: "8", 
      txzOutputDir: join(startingDir, "deploy/release/test"),
      tag: "",
      buildNumber: 1
    };

    const result = await validateTxzEnv(envArgs);

    expect(result).toEqual(expected);
  });

  it("should warn and skip validation when skipValidation is true", async () => {
    const envArgs = { 
      apiVersion: "4.17.0",
      baseUrl: "https://example.com",
      skipValidation: "true" 
    };
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
    const envArgs = { 
      apiVersion: "4.17.0",
      baseUrl: "https://example.com",
      skipValidation: "invalid" 
    };

    await expect(validateTxzEnv(envArgs)).rejects.toThrow(
      "Must be true or false"
    );
  });
});
