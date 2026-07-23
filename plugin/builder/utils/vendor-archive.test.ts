import { mkdtemp, readFile, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { writeVendorArchiveInfo } from "./vendor-archive";

describe("writeVendorArchiveInfo", () => {
  it("keeps generated content and archive metadata deterministic", async () => {
    const directory = await mkdtemp(join(tmpdir(), "vendor-archive-"));
    const configPath = join(directory, "config", "vendor_archive.json");
    const config = {
      vendor_store_path: "/boot/config/plugins/dynamix.my.servers/vendor-4.36.0.tar.zst",
      api_version: "4.36.0",
    };

    await writeVendorArchiveInfo(configPath, config);
    const firstContents = await readFile(configPath);
    const firstStat = await stat(configPath);

    await writeVendorArchiveInfo(configPath, config);
    const secondContents = await readFile(configPath);
    const secondStat = await stat(configPath);

    expect(secondContents).toEqual(firstContents);
    expect(firstStat.mtimeMs).toBe(0);
    expect(secondStat.mtimeMs).toBe(0);
  });
});
