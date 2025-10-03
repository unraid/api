#!/usr/bin/env node
import { promises as fs } from 'fs';
import path from 'path';
import url from 'url';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const LOCALES_DIR = path.join(__dirname, '..', 'src', 'locales');

function sortValue(value) {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, key) => {
        acc[key] = sortValue(value[key]);
        return acc;
      }, {});
  }
  return value;
}

async function sortLocaleFile(filePath) {
  const original = await fs.readFile(filePath, 'utf8');
  const parsed = JSON.parse(original);
  const sorted = sortValue(parsed);
  const normalized = JSON.stringify(sorted, null, 2) + '\n';
  if (normalized !== original) {
    await fs.writeFile(filePath, normalized, 'utf8');
    return true;
  }
  return false;
}

async function main() {
  const entries = await fs.readdir(LOCALES_DIR, { withFileTypes: true });
  let changed = false;
  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith('.json')) {
      const localePath = path.join(LOCALES_DIR, entry.name);
      const updated = await sortLocaleFile(localePath);
      changed = changed || updated;
    }
  }
  if (changed) {
    console.log('[i18n] Sorted locale files.');
  } else {
    console.log('[i18n] Locale files already sorted.');
  }
}

main().catch((error) => {
  console.error('[i18n] Failed to sort locale files.', error);
  process.exit(1);
});
