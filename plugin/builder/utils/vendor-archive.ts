import { mkdir, readFile, utimes, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

export interface VendorArchiveInfo {
  vendor_store_path: string;
  api_version: string;
}

// vendor_archive.json is generated during every TXZ build. A wall-clock mtime
// on that one file made otherwise unchanged package trees produce different
// tar streams and hashes. Epoch is valid for tar and gives every builder the
// same metadata without depending on checkout or invocation time.
const DETERMINISTIC_MTIME = new Date(0);

export async function writeVendorArchiveInfo(
  configPath: string,
  configData: VendorArchiveInfo,
): Promise<void> {
  const contents = `${JSON.stringify(configData, null, 2)}\n`;

  await mkdir(dirname(configPath), { recursive: true });

  let currentContents: string | undefined;
  try {
    currentContents = await readFile(configPath, "utf8");
  } catch (error) {
    if (!(error instanceof Error && "code" in error && error.code === "ENOENT")) {
      throw error;
    }
  }

  if (currentContents !== contents) {
    await writeFile(configPath, contents, "utf8");
  }

  await utimes(configPath, DETERMINISTIC_MTIME, DETERMINISTIC_MTIME);
}
