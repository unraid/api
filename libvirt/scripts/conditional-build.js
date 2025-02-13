const { spawnSync } = require("child_process");
const { platform } = require("os");
const fs = require("fs");

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
    if (checkLibvirt()) {
      console.log("Building native bindings...");
      runCommand("pnpm", ["run", "build/native"]);

      console.log("Building TypeScript...");
      runCommand("pnpm", ["run", "build/ts"]);
    } else {
      console.log(
        "Failed to install/find libvirt, building stub implementation..."
      );
      runCommand("pnpm", ["run", "build/stub"]);

      if (fs.existsSync("dist/stub.d.ts")) {
        fs.copyFileSync("dist/stub.d.ts", "dist/index.d.ts");
        fs.copyFileSync("dist/stub.js", "dist/index.js");
      } else {
        console.error("Stub build failed to generate files");
        process.exit(1);
      }
    }
  } catch (error) {
    console.error("Build failed:", error);
    process.exit(1);
  }
}

build().catch((error) => {
  console.error("Unhandled error:", error);
  process.exit(1);
});
