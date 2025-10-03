#!/usr/bin/env node

import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

async function loadExtractor() {
  const module = await import('vue-i18n-extract');
  if (typeof module.createI18NReport === 'function') {
    return module.createI18NReport;
  }
  if (module.default && typeof module.default.createI18NReport === 'function') {
    return module.default.createI18NReport;
  }
  throw new Error('createI18NReport export not found');
}

async function readJson(filePath) {
  const raw = await readFile(filePath, 'utf8');
  return raw.trim() ? JSON.parse(raw) : {};
}

async function writeJson(filePath, data) {
  const json = JSON.stringify(data, null, 2) + '\n';
  await writeFile(filePath, json, 'utf8');
}

async function main() {
  const createI18NReport = await loadExtractor();

  const root = process.cwd();
  const localesDir = path.resolve(root, 'src/locales');
  const localeFiles = (await readdir(localesDir)).filter((file) => file.endsWith('.json'));

  if (localeFiles.length === 0) {
    console.log('[i18n] No locale files found.');
    return;
  }

  const englishLocale = 'en_US';
  const englishFileName = 'en.json';

  const localeDescriptors = localeFiles.map((file) => {
    const rawLocale = file.replace(/\.json$/, '');
    const locale = rawLocale === 'en' ? englishLocale : rawLocale;
    return {
      locale,
      file,
      absPath: path.resolve(localesDir, file),
    };
  });

  const missingByLocale = new Map(localeDescriptors.map(({ locale }) => [locale, new Set()]));

  let report;
  const originalLog = console.log;
  const originalTable = console.table;
  const originalInfo = console.info;
  const originalWarn = console.warn;
  try {
    console.log = () => {};
    console.table = () => {};
    console.info = () => {};
    console.warn = () => {};
    report = await createI18NReport({
      vueFiles: 'src/**/*.{vue,ts,js}',
      languageFiles: 'src/locales/*.json',
    });
  } finally {
    console.log = originalLog;
    console.table = originalTable;
    console.info = originalInfo;
    console.warn = originalWarn;
  }

  for (const entry of report.missingKeys ?? []) {
    const rawLocale = path.basename(entry.language, '.json');
    const normalizedLocale = rawLocale === 'en' ? englishLocale : rawLocale;
    const target = missingByLocale.get(normalizedLocale);
    if (target) {
      target.add(entry.path);
    }
  }

  const englishDescriptor = localeDescriptors.find((descriptor) => descriptor.file === englishFileName);
  if (!englishDescriptor) {
    throw new Error(`Source locale file ${englishFileName} not found in ${localesDir}`);
  }

  const englishData = await readJson(englishDescriptor.absPath);
  const englishMissing = missingByLocale.get(englishLocale) ?? new Set();

  let addedEnglish = 0;
  for (const key of englishMissing) {
    if (!(key in englishData)) {
      englishData[key] = key;
      addedEnglish += 1;
    }
  }

  if (addedEnglish > 0) {
    await writeJson(englishDescriptor.absPath, englishData);
  }

  // Ensure other locales receive any new English keys by default.
  for (const [locale, missingSet] of missingByLocale.entries()) {
    if (locale === englishLocale) {
      continue;
    }
    const targetSet = missingSet ?? new Set();
    for (const key of englishMissing) {
      targetSet.add(key);
    }
    missingByLocale.set(locale, targetSet);
  }

  const localeUpdates = [];

  for (const descriptor of localeDescriptors) {
    const { locale, absPath, file } = descriptor;
    if (locale === englishLocale) {
      continue;
    }

    const missingKeys = missingByLocale.get(locale);
    if (!missingKeys || missingKeys.size === 0) {
      continue;
    }

    const localeData = await readJson(absPath);
    let added = 0;
    for (const key of missingKeys) {
      if (!(key in localeData)) {
        localeData[key] = englishData[key] ?? key;
        added += 1;
      }
    }

    if (added > 0) {
      await writeJson(absPath, localeData);
      localeUpdates.push({ file, added });
    }
  }

  if (addedEnglish === 0 && localeUpdates.length === 0) {
    console.log('[i18n] No missing translation keys detected.');
    return;
  }

  if (addedEnglish > 0) {
    console.log(`[i18n] Added ${addedEnglish} key(s) to ${englishFileName}.`);
  }

  for (const update of localeUpdates) {
    console.log(`[i18n] Added ${update.added} key(s) to ${update.file}.`);
  }
}

main().catch((error) => {
  console.error('[i18n] Failed to extract translations.', error);
  process.exitCode = 1;
});
