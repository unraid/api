import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createPlugin } from "./create-plugin";

const generatedDirectories: string[] = [];

afterEach(async () => {
  await Promise.all(
    generatedDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true }),
    ),
  );
});

describe("createPlugin", () => {
  it("generates a self-contained scaffold with build and validation commands", async () => {
    const targetDirectory = await mkdtemp(join(tmpdir(), "unraid-plugin-generator-"));
    generatedDirectories.push(targetDirectory);

    const pluginDirectory = await createPlugin("example-plugin", targetDirectory);
    const packageJson = JSON.parse(
      await readFile(join(pluginDirectory, "package.json"), "utf8"),
    );
    const tsconfig = JSON.parse(
      await readFile(join(pluginDirectory, "tsconfig.json"), "utf8"),
    );
    const indexSource = await readFile(join(pluginDirectory, "src", "index.ts"), "utf8");
    const generatedFiles = await Promise.all(
      ["config.entity.ts", "index.ts", "example-plugin.resolver.ts"].map((file) =>
        readFile(join(pluginDirectory, "src", file), "utf8"),
      ),
    );

    expect(packageJson.scripts.validate).toBe("npm run build && npm pack --dry-run");
    expect(packageJson.devDependencies.graphql).toBeDefined();
    expect(packageJson.peerDependencies.graphql).toBeDefined();
    expect(tsconfig.compilerOptions.skipLibCheck).toBe(true);
    expect(indexSource).not.toContain("ConfigPersister");
    expect(generatedFiles.join("\n")).not.toContain("@unraid/shared");
  });
});
