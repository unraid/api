import { cp, readFile, mkdir } from "fs/promises";
import { basename, join } from "path";
import { createHash } from "node:crypto";
import { $, cd, version } from "zx";
import { setupEnvironment } from "./setup-plugin-environment";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { execSync } from "node:child_process";
import { pluginName, startingDir } from "./consts";

const validatedEnv = await setupEnvironment("txz");

const createTxzDirectory = async () => {
  await execSync(`rm -rf deploy/pre-pack/*`);
  await execSync(`rm -rf deploy/release/*`);
  await execSync(`rm -rf deploy/test/*`);

  await mkdir("deploy/test", { recursive: true });
  await mkdir("deploy/pre-pack", { recursive: true });
  await mkdir("deploy/release/archive", { recursive: true });
};

const validateSourceDir = async () => {
  if (!validatedEnv.CI) {
    console.log("Validating TXZ source directory");
  }
  const sourceDir = join(startingDir, "source");
  if (!existsSync(sourceDir)) {
    throw new Error(`Source directory ${sourceDir} does not exist`);
  }
  // Validate existence of webcomponent files:
  // source/dynamix.unraid.net/usr/local/emhttp/plugins/dynamix.my.servers/unraid-components
  const webcomponentDir = join(
    sourceDir,
    "dynamix.unraid.net",
    "usr",
    "local",
    "emhttp",
    "plugins",
    "dynamix.my.servers",
    "unraid-components"
  );
  if (!existsSync(webcomponentDir)) {
    throw new Error(`Webcomponent directory ${webcomponentDir} does not exist`);
  }
  // Validate that there are webcomponents
  const webcomponents = await readdir(webcomponentDir);
  if (webcomponents.length === 1 && webcomponents[0] === ".gitkeep") {
    throw new Error(`No webcomponents found in ${webcomponentDir}`);
  }
  // Check for the existence of "ui.manifest.json" as well as "manifest.json" in webcomponents
  if (
    !webcomponents.includes("ui.manifest.json") ||
    !webcomponents.includes("manifest.json")
  ) {
    throw new Error(
      `Webcomponents must contain both "ui.manifest.json" and "manifest.json"`
    );
  }

  const apiDir = join(
    startingDir,
    "source/dynamix.unraid.net/usr/local/unraid-api/package.json"
  );
  if (!existsSync(apiDir)) {
    throw new Error(`API directory ${apiDir} does not exist`);
  }
};

const buildTxz = async (): Promise<{
  txzName: string;
}> => {
  if (validatedEnv.SKIP_VALIDATION !== "true") {
    await validateSourceDir();
  }

  const txzName = `${pluginName}.txz`;
  const txzPath = join(startingDir, "deploy/release/archive", txzName);
  const prePackDir = join(startingDir, "deploy/pre-pack");

  // Copy all files from source to temp dir, excluding specific files
  await cp(join(startingDir, "source/dynamix.unraid.net"), prePackDir, {
    recursive: true,
    filter: (src) => {
      const filename = basename(src);
      return ![
        ".DS_Store",
        "pkg_build.sh",
        "makepkg",
        "explodepkg",
        "sftp-config.json",
        ".gitkeep",
      ].includes(filename);
    },
  });

  // Create package - must be run from within the pre-pack directory
  // Use cd option to run command from prePackDir
  await cd(prePackDir);
  $.verbose = true;

  await $`${join(startingDir, "scripts/makepkg")} -l ${
    validatedEnv.CI ? "y" : "n"
  } -c ${validatedEnv.CI ? "y" : "n"} --compress ${
    validatedEnv.CI ? "-5" : "-1"
  } "${txzPath}"`;
  $.verbose = false;
  await cd(startingDir);

  if (validatedEnv.SKIP_VALIDATION !== "true") {
    try {
      await $`${join(startingDir, "scripts/explodepkg")} "${txzPath}"`;
    } catch (err) {
      console.error(`Error: invalid txz package created: ${txzPath}`);
      process.exit(1);
    }
  }

  return { txzName };
};

const main = async () => {
  await createTxzDirectory();
  await buildTxz();
};

await main();
