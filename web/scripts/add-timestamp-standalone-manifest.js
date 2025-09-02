#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

const distPath = '.nuxt/standalone-apps';
const manifestPath = path.join(distPath, 'standalone.manifest.json');

// Check if directory exists
if (!fs.existsSync(distPath)) {
  console.warn(`Directory ${distPath} does not exist. Skipping manifest generation.`);
  process.exit(0);
}

// Get all JS files in the dist directory
const files = fs.readdirSync(distPath);
const manifest = {};

files.forEach(file => {
  if (file.endsWith('.js') || file.endsWith('.css')) {
    const key = file.replace(/\.(js|css)$/, '.$1');
    manifest[key] = {
      file: file,
      src: file,
    };
  }
});

// Add timestamp
manifest.ts = Date.now();

// Write manifest
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log('Standalone apps manifest created:', manifestPath);
