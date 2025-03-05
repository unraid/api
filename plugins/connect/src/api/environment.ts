import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const getPackageJsonVersion = () => {
  try {
    // Try different possible locations for package.json
    const possibleLocations = ["../package.json", "../../package.json"];

    for (const location of possibleLocations) {
      try {
        const packageJsonUrl = import.meta.resolve(location);
        const packageJsonPath = fileURLToPath(packageJsonUrl);
        const packageJson = readFileSync(packageJsonPath, "utf-8");
        const packageJsonObject = JSON.parse(packageJson);
        if (packageJsonObject.version) {
          return packageJsonObject.version;
        }
      } catch {
        // Continue to next location if this one fails
      }
    }

    // If we get here, we couldn't find a valid package.json in any location
    console.error(
      "Could not find package.json in any of the expected locations"
    );
    return undefined;
  } catch (error) {
    console.error("Failed to load package.json:", error);
    return undefined;
  }
};

export const API_VERSION =
  process.env.npm_package_version ??
  getPackageJsonVersion() ??
  new Error("API_VERSION not set");
