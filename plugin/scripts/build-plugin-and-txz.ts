#!/usr/bin/env node

import path from "path";
import crypto from "crypto";
import { execSync } from "child_process";
import os from "os";
import { mkdtemp, cp, readFile, writeFile } from "fs/promises";
import { glob } from "glob";

const pluginName = "dynamix.unraid.net" as const;

const buildTxz = async (): Promise<{
  sha256: string;
  txzPath: string;
  version: string;
}> => {
  const version = new Date()
    .toISOString()
    .replace(/[-:]/g, ".")
    .slice(0, 16)
    .replace("T", ".");
  const txzPath = path.join(
    process.cwd(),
    "archive",
    `${pluginName}-${version}.txz`
  );

  const startingDir = process.cwd();
  const tempDir = await mkdtemp("plugin-");

  // Copy all files from source to temp dir, excluding specific files
  await cp("source/dynamix.unraid.net", tempDir, {
    recursive: true,
    filter: (src) => {
      const filename = path.basename(src);
      return ![
        ".DS_Store",
        "pkg_build.sh",
        "makepkg",
        "explodepkg",
        "sftp-config.json",
      ].includes(filename);
    },
  });

  // Set permissions
  execSync(`chmod 0755 -R ${tempDir}`);
  execSync(`sudo chown root:root -R ${tempDir}`);

  // Create package
  execSync(`sudo "scripts/makepkg" -l y -c y "${txzPath}"`);
  execSync(`sudo rm -rf "${tempDir}"`);

  // Calculate hashes
  const sha256 = execSync(`sha256sum "${txzPath}"`).toString().split(" ")[0];
  console.log(`SHA256: ${sha256}`);

  // Test package
  const testTmpdir = await mkdtemp("test-");
  process.chdir(testTmpdir);

  try {
    execSync(`sudo "${startingDir}/scripts/explodepkg" "${txzPath}"`, {
      stdio: "pipe",
    });
  } catch (err) {
    console.error(`Error: invalid txz package created: ${txzPath}`);
    process.exit(1);
  } finally {
    execSync(`sudo rm -rf "${testTmpdir}"`);
  }

  return { sha256, txzPath, version };
};

const buildPlugin = async ({
  type,
  txzSha256,
  version,
}: {
  type: "staging" | "pr" | "production";
  txzSha256: string;
  version: string;
}) => {
  // Parse command line args
  let env;
  if (process.argv[2] === "s") env = "staging";
  if (process.argv[2] === "p") env = "production";
  if (!env) {
    console.log("usage: [s|p]");
    process.exit(1);
  }

  // Get PR number if provided
  const PR = process.argv[3] || "";

  // Set up paths
  const plgfile = path.join("plugins", `${pluginName}.plg.${type}`);

  // Define URLs
  let PLUGIN_URL = "";
  let MAIN_TXZ = "";
  let API_TGZ = "";
  switch (type) {
    case "production":
      PLUGIN_URL = "https://stable.dl.unraid.net/unraid-api/&name;.plg";
      MAIN_TXZ = `https://stable.dl.unraid.net/unraid-api/${pluginName}-${version}.txz`;
      API_TGZ = `https://stable.dl.unraid.net/unraid-api/unraid-api-${process.env.API_VERSION}.tgz`;
      break;
    case "pr":
      MAIN_TXZ = `https://preview.dl.unraid.net/unraid-api/pr/${PR}/${pluginName}-${version}.txz`;
      API_TGZ = `https://preview.dl.unraid.net/unraid-api/pr/${PR}/unraid-api-${process.env.API_VERSION}.tgz`;
      PLUGIN_URL = `https://preview.dl.unraid.net/unraid-api/pr/${PR}/${pluginName}.plg`;
      break;
    case "staging":
      PLUGIN_URL = "https://stable.dl.unraid.net/unraid-api/&name;.plg";
      MAIN_TXZ = `https://preview.dl.unraid.net/unraid-api/${pluginName}-${version}.txz`;
      API_TGZ = `https://preview.dl.unraid.net/unraid-api/unraid-api-${process.env.API_VERSION}.tgz`;
      break;
  }

  // Update plg file
  const plgContent = await readFile(plgfile, "utf8");
  const xmlDoc = new DOMParser().parseFromString(plgContent, "text/xml");

  // Update entity values
  const entities = {
    name: pluginName,
    env: env,
    version: version,
    pluginURL: PLUGIN_URL,
    SHA256: txzSha256,
    MAIN_TXZ: MAIN_TXZ,
    API_TGZ: API_TGZ,
    PR: PR,
    API_version: process.env.API_VERSION,
    API_SHA256: process.env.API_SHA256,
  };

  for (const [name, value] of Object.entries(entities)) {
    const entity = xmlDoc.querySelector(`ENTITY[name="${name}"]`);
    if (entity && value) {
      entity.textContent = value;
    } else {
      console.error(`Entity ${name} or value ${value} not found in ${plgfile}`);
      process.exit(1);
    }
  }

  const serializer = new XMLSerializer();
  const updatedPlg = serializer.serializeToString(xmlDoc);

  await writeFile(plgfile, updatedPlg);

  console.log(`${env} plugin: ${plgfile}`);
};

const { sha256: txzSha256, txzPath, version } = await buildTxz();
console.log("Path to txz:", txzPath);
await buildPlugin({ type: "staging", txzSha256, version });
await buildPlugin({ type: "pr", txzSha256, version });
await buildPlugin({ type: "production", txzSha256, version });
