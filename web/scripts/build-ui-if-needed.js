#!/usr/bin/env node
import { execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const rootDir = join(__dirname, '..', '..');
const uiSrcDir = join(rootDir, 'unraid-ui', 'src');
const uiDistDir = join(rootDir, 'unraid-ui', 'dist');
const uiDistIndexFile = join(uiDistDir, 'index.js');

function getLatestModificationTime(dir) {
  const result = execSync(
    `find "${dir}" -type f -name "*.ts" -o -name "*.tsx" -o -name "*.vue" -o -name "*.css" | xargs stat -f "%m" 2>/dev/null | sort -rn | head -1 || echo 0`,
    {
      encoding: 'utf-8',
      shell: true,
    }
  ).trim();

  return parseInt(result) || 0;
}

function shouldRebuild() {
  // If dist doesn't exist, we need to build
  if (!existsSync(uiDistIndexFile)) {
    console.log('UI library dist not found, building...');
    return true;
  }

  // Get the modification time of the dist index file
  const distModTime = statSync(uiDistIndexFile).mtimeMs / 1000;

  // Get the latest modification time from source files
  const srcModTime = getLatestModificationTime(uiSrcDir);

  // Also check package.json, vite.config.ts, etc.
  const configFiles = [
    join(rootDir, 'unraid-ui', 'package.json'),
    join(rootDir, 'unraid-ui', 'vite.config.ts'),
    join(rootDir, 'unraid-ui', 'tsconfig.json'),
  ];

  let latestConfigModTime = 0;
  for (const file of configFiles) {
    if (existsSync(file)) {
      const modTime = statSync(file).mtimeMs / 1000;
      if (modTime > latestConfigModTime) {
        latestConfigModTime = modTime;
      }
    }
  }

  const latestSrcTime = Math.max(srcModTime, latestConfigModTime);

  if (latestSrcTime > distModTime) {
    console.log('UI library source files changed, rebuilding...');
    return true;
  }

  console.log('UI library is up to date, skipping build.');
  return false;
}

try {
  if (shouldRebuild()) {
    console.log('Building @unraid/ui...');
    execSync('pnpm --filter=@unraid/ui build', {
      stdio: 'inherit',
      cwd: rootDir,
    });
    console.log('UI library build complete.');
  }
} catch (error) {
  console.error('Error building UI library:', error.message);
  process.exit(1);
}
