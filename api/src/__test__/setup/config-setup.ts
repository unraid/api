import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';
import { resolve } from 'path';

// Get the project root directory
const projectRoot = resolve(process.cwd());

// Define paths
const sourceFile = join(projectRoot, 'dev/Unraid.net/myservers.example.cfg');
const destFile = join(projectRoot, 'dev/Unraid.net/myservers.cfg');

// Ensure the example file exists
if (!existsSync(sourceFile)) {
  console.error('Error: myservers.example.cfg not found!');
  process.exit(1);
}

copyFileSync(sourceFile, destFile);