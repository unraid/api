import { join } from "path";
import { existsSync, mkdirSync, createWriteStream, readFileSync } from "fs";
import { writeFile, readFile, unlink } from "fs/promises";
import { get } from "https";
import { $ } from "zx";
import { startingDir } from "./consts";

const RCLONE_VERSION_PATHS = [
  join(startingDir, "..", ".rclone-version"),
  join(startingDir, ".rclone-version"),
];

const findRcloneVersion = () => {
  for (const path of RCLONE_VERSION_PATHS) {
    if (existsSync(path)) {
      return readFileSync(path, "utf8").trim();
    }
  }
  throw new Error(".rclone-version file not found");
};

const RCLONE_VERSION = findRcloneVersion();
const RCLONE_FILENAME = `rclone-v${RCLONE_VERSION}-linux-amd64.zip`;
const RCLONE_URL = `https://downloads.rclone.org/v${RCLONE_VERSION}/${RCLONE_FILENAME}`;
const RCLONE_DEST = join(startingDir, "source", "dynamix.unraid.net", "usr", "local", "rclone");
const RCLONE_VERSION_FILE = join(RCLONE_DEST, ".rclone-version");
const RCLONE_BIN = join(RCLONE_DEST, "rclone");

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

export async function ensureRclone() {
  let currentVersion: string | null = null;
  if (existsSync(RCLONE_VERSION_FILE)) {
    currentVersion = (await readFile(RCLONE_VERSION_FILE, "utf8")).trim();
  }
  if (currentVersion !== RCLONE_VERSION) {
    mkdirSync(RCLONE_DEST, { recursive: true });
    if (!existsSync(RCLONE_FILENAME)) {
      await fetchFile(RCLONE_URL, RCLONE_FILENAME);
    }
    await $`unzip -oj ${RCLONE_FILENAME} rclone-v${RCLONE_VERSION}-linux-amd64/rclone -d ${RCLONE_DEST}`;
    await $`chmod +x ${RCLONE_BIN}`;
    await writeFile(RCLONE_VERSION_FILE, RCLONE_VERSION, "utf8");
    // Clean up old rclone archives
    const glob = await import("glob");
    const files = glob.sync("rclone-v*-linux-amd64.zip", { cwd: startingDir });
    for (const file of files) {
      if (file !== RCLONE_FILENAME) await unlink(join(startingDir, file));
    }
  }
} 