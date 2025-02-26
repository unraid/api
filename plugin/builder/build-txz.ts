import { mkdir } from "fs/promises";
import { join } from "path";
import { $, cd } from "zx";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { execSync } from "node:child_process";
import { getTxzName, startingDir } from "./utils/consts";
import { setupTxzEnv, TxzEnv } from "./cli/setup-txz-environment";

const createTxzDirectory = async () => {
  await execSync(`rm -rf deploy/pre-pack/*`);
  await execSync(`rm -rf deploy/release/*`);
  await execSync(`rm -rf deploy/test/*`);

  await mkdir("deploy/test", { recursive: true });
  await mkdir("deploy/pre-pack", { recursive: true });
  await mkdir("deploy/release/archive", { recursive: true });
};

const validateSourceDir = async (validatedEnv: TxzEnv) => {
  if (!validatedEnv.ci) {
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

const buildTxz = async (validatedEnv: TxzEnv) => {
  await validateSourceDir(validatedEnv);
  const txzPath = join(validatedEnv.txzOutputDir, getTxzName());

  // Create package - must be run from within the pre-pack directory
  // Use cd option to run command from prePackDir
  await cd(validatedEnv.txzOutputDir);
  $.verbose = true;

  const makepkgOptions: Record<string, { key: string; value: string }> = {
    chown: { key: "--chown", value: validatedEnv.ci ? "y" : "n" },
    compress: { key: "--compress", value: validatedEnv.compress },
    moveSymlinks: { key: "--linkadd", value: validatedEnv.ci ? "y" : "n" },
  };

  await $`${join(startingDir, "scripts/makepkg")} ${Object.values(
    makepkgOptions
  )
    .map((option) => `${option.key} ${option.value}`)
    .join(" ")} "${txzPath}"`;
  $.verbose = false;
  await cd(startingDir);

  if (validatedEnv.skipValidation !== "true") {
    try {
      await $`${join(startingDir, "scripts/explodepkg")} "${txzPath}"`;
    } catch (err) {
      console.error(`Error: invalid txz package created: ${txzPath}`);
      process.exit(1);
    }
  }
};

const main = async () => {
  const validatedEnv = await setupTxzEnv(process.argv);
  await createTxzDirectory();
  await buildTxz(validatedEnv);
};

await main();
