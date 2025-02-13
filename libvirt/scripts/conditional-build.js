const { spawnSync } = require("child_process");
const { platform } = require("os");
const fs = require("fs");
const { exec } = require("child_process");

function runCommand(command, args, options = {}) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    shell: true,
    ...options,
  });

  if (result.status !== 0) {
    console.error(`Command failed: ${command} ${args.join(" ")}`);
    process.exit(1);
  }

  return result;
}

function installLibvirtMac() {
  console.log("Installing libvirt via Homebrew...");
  return runCommand("brew", ["install", "libvirt"]);
}

function checkLibvirt() {
  if (platform() === "darwin") {
    // Check if libvirt is installed on macOS
    const result = spawnSync("brew", ["list", "libvirt"], { stdio: "pipe" });
    if (result.status !== 0) {
      return installLibvirtMac();
    }

    return true;
  }

  if (platform() === "linux") {
    return true;
  }

  // Add other platform checks as needed
  return false;
}

async function build() {
  try {
    await exec('pnpm run build/native');
    await exec('pnpm run build/ts');
  } catch (error) {
    console.error('Failed to build:', error);
    process.exit(1);
  }
}

build().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
