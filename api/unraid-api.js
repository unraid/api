#!/usr/bin/env node
import { execSync } from "child_process";

// Collect all arguments passed to the script
const args = process.argv.slice(2).join(" ");



// Run the TypeScript app using tsx and pass the arguments
try {
  execSync(`npm run tsx:unraid -- ${args}`, { stdio: "inherit", cwd: import.meta.dirname });
} catch (error) {
  console.error("Failed to run the TypeScript app", error);
  process.exit(1);
}
