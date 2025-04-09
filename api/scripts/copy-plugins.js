#!/usr/bin/env node

/**
 * This AI-generated script copies workspace plugin dist folders to the dist/plugins directory
 * to ensure they're available for dynamic imports in production.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the package.json to find workspace dependencies
const packageJsonPath = path.resolve(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

// Create the plugins directory if it doesn't exist
const pluginsDir = path.resolve(__dirname, '../dist/plugins');
if (!fs.existsSync(pluginsDir)) {
  fs.mkdirSync(pluginsDir, { recursive: true });
}

// Find all workspace plugins
const pluginPrefix = 'unraid-api-plugin-';
const workspacePlugins = Object.keys(packageJson.peerDependencies || {})
  .filter(pkgName => pkgName.startsWith(pluginPrefix));

// Copy each plugin's dist folder to the plugins directory
for (const pkgName of workspacePlugins) {
  const pluginPath = path.resolve(__dirname, `../../packages/${pkgName}`);
  const pluginDistPath = path.resolve(pluginPath, 'dist');
  const targetPath = path.resolve(pluginsDir, pkgName);
  
  // Run pnpm build for the plugin
  console.log(`Building ${pkgName}...`);
  try {
    execSync('pnpm build', { 
      cwd: pluginPath,
      stdio: 'inherit'
    });
    console.log(`Successfully built ${pkgName}`);
  } catch (error) {
    console.error(`Failed to build ${pkgName}:`, error.message);
    continue; // Skip copying if build fails
  }
  
  if (fs.existsSync(pluginDistPath)) {
    console.log(`Copying ${pkgName} dist folder to ${targetPath}`);
    
    // Create the target directory if it doesn't exist
    if (!fs.existsSync(targetPath)) {
      fs.mkdirSync(targetPath, { recursive: true });
    }
    
    // Copy the entire dist folder recursively
    copyFolderRecursive(pluginDistPath, targetPath);
  } else {
    console.warn(`Plugin ${pkgName} dist folder not found at ${pluginDistPath}`);
  }
}

console.log('Plugin dist folders copied successfully');

/**
 * Recursively copy a folder and its contents
 * @param {string} source - Source folder path
 * @param {string} target - Target folder path
 */
function copyFolderRecursive(source, target) {
  // Create target folder if it doesn't exist
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // Read all files and folders in the source directory
  const files = fs.readdirSync(source);

  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);

    // Check if the current path is a file or a directory
    if (fs.lstatSync(sourcePath).isDirectory()) {
      // If it's a directory, recursively copy it
      copyFolderRecursive(sourcePath, targetPath);
    } else {
      // If it's a file, copy it
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
} 