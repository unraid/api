import { join } from "path";
import { $, cd } from "zx";
import { existsSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { getTxzName, pluginName, startingDir } from "./utils/consts";
import { setupTxzEnv, TxzEnv } from "./cli/setup-txz-environment";
import { cleanupTxzFiles } from "./utils/cleanup";


// Recursively search for manifest files
const findManifestFiles = async (dir: string): Promise<string[]> => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findManifestFiles(fullPath)));
    } else if (
      entry.isFile() &&
      (entry.name === "manifest.json" || entry.name === "ui.manifest.json")
    ) {
      files.push(entry.name);
    }
  }

  return files;
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

  const manifestFiles = await findManifestFiles(webcomponentDir);
  const hasManifest = manifestFiles.includes("manifest.json");
  const hasUiManifest = manifestFiles.includes("ui.manifest.json");

  if (!hasManifest || !hasUiManifest) {
    console.log(
      "Existing Manifest Files:", manifestFiles);
    throw new Error(
      `Webcomponents must contain both "ui.manifest.json" and "manifest.json" - be sure to have run pnpm build:wc in unraid-ui`
    );
    
  }

  const apiDir = join(
    startingDir,
    "source", pluginName, "usr", "local", "unraid-api", "package.json"
  );
  if (!existsSync(apiDir)) {
    throw new Error(`API package.json file ${apiDir} does not exist`);
  }
};

const buildTxz = async (validatedEnv: TxzEnv) => {
  await validateSourceDir(validatedEnv);
  const txzPath = join(validatedEnv.txzOutputDir, getTxzName());

  // Create package - must be run from within the pre-pack directory
  // Use cd option to run command from prePackDir
  await cd(join(startingDir, "source", "dynamix.unraid.net"));
  $.verbose = true;

  await $`${join(startingDir, "scripts/makepkg")} --chown y --compress -${validatedEnv.compress} --linkadd y ${txzPath}`;
  $.verbose = false;
  await cd(startingDir);
};

const main = async () => {
  const validatedEnv = await setupTxzEnv(process.argv);
  await cleanupTxzFiles();
  await buildTxz(validatedEnv);
};

await main();
