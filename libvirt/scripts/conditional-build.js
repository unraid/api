import { spawnSync, execSync } from "child_process";
import { platform } from "os";
import { existsSync } from "fs";

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
    // Verify libvirt daemon is available
    const libvirtdCheck = spawnSync("which", ["libvirtd"], { stdio: "pipe" });
    if (libvirtdCheck.status !== 0) {
      console.error("libvirt installation appears broken - libvirtd not found");
      return false;
    }

    return true;
  }

  if (platform() === "linux") {
    // Check if libvirt headers are installed
    const headerPath = "/usr/include/libvirt/libvirt.h";

    if (!existsSync(headerPath)) {
      console.error(`
libvirt headers not found. Please install the development package:

For Debian/Ubuntu:
  sudo apt-get install libvirt-dev

For Fedora/RHEL:
  sudo dnf install libvirt-devel

For Arch Linux:
  sudo pacman -S libvirt
`);
      return false;
    }

    return true;
  }

  // Add other platform checks as needed
  return false;
}

async function build() {
  try {
    // Check libvirt installation first
    if (!checkLibvirt()) {
      console.error("Libvirt is not available on this platform");
      process.exit(1);
    }

    console.log("Running native build...");
    execSync("pnpm run build/native", { stdio: "inherit" });

    console.log("Running TypeScript build...");
    execSync("pnpm run build/ts", { stdio: "inherit" });
  } catch (error) {
    console.error("Failed to build:", error);
    process.exit(1);
  }
}

build().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
