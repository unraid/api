import { join } from "path";
import { existsSync, mkdirSync, createWriteStream, readFileSync } from "fs";
import { writeFile, readFile } from "fs/promises";
import { get } from "https";
import { $ } from "zx";
import { startingDir } from "./consts";

const findNvmrc = () => {
  const nvmrcPaths = [
    join(startingDir, "..", ".nvmrc"),
    join(startingDir, ".nvmrc"),
  ];
  for (const nvmrcPath of nvmrcPaths) {
    if (existsSync(nvmrcPath)) {
      return nvmrcPath;
    }
  }
  throw new Error("NVMRC file not found");
}
// Read Node.js version from .nvmrc
const NVMRC_PATH = findNvmrc();
console.log(`NVMRC_PATH: ${NVMRC_PATH}`);
const NODE_VERSION = readFileSync(NVMRC_PATH, "utf8").trim();

const NODE_FILENAME = `node-v${NODE_VERSION}-linux-x64.tar.xz`;
const NODE_URL = `https://nodejs.org/download/release/v${NODE_VERSION}/${NODE_FILENAME}`;
const NODE_DEST = join(startingDir, "source", "dynamix.unraid.net", "usr", "local");
const NODE_VERSION_FILE = join(NODE_DEST, ".node-version");

async function fetchFile(url: string, dest: string) {
  return new Promise((resolve, reject) => {
    const file = createWriteStream(dest);
    get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => file.close(resolve));
      file.on("error", reject);
    }).on("error", reject);
  });
}

export async function ensureNodeJs() {
  let currentVersion: string | null = null;
  if (existsSync(NODE_VERSION_FILE)) {
    currentVersion = (await readFile(NODE_VERSION_FILE, "utf8")).trim();
  }
  if (currentVersion !== NODE_VERSION) {
    mkdirSync(NODE_DEST, { recursive: true });
    if (!existsSync(NODE_FILENAME)) {
      await fetchFile(NODE_URL, NODE_FILENAME);
    }
    await $`tar --strip-components=1 -xf ${NODE_FILENAME} -C ${NODE_DEST}`;
    await writeFile(NODE_VERSION_FILE, NODE_VERSION, "utf8");
  }
} 