#!/usr/bin/env node
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

import { parse } from '@vue/compiler-sfc';

import { glob } from 'glob';
import ts from 'typescript';

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

function expandJsonFormsKey(key) {
  const expanded = new Set();

  // Preserve explicit keys for shared error translations
  if (key.startsWith('jsonforms.errors')) {
    expanded.add(key);
    return expanded;
  }

  expanded.add(key.endsWith('.label') ? key : `${key}.label`);

  return expanded;
}

function stripAsExpressions(node) {
  let current = node;
  while (current && (ts.isAsExpression(current) || ts.isTypeAssertionExpression(current))) {
    current = current.expression;
  }
  return current;
}

function getPropertyName(node) {
  if (!node) return undefined;
  if (ts.isIdentifier(node) || ts.isStringLiteralLike(node)) {
    return node.text;
  }
  return undefined;
}

function objectLiteralToObject(node) {
  const result = {};
  for (const prop of node.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      continue;
    }
    const name = getPropertyName(prop.name);
    if (!name) {
      continue;
    }
    const value = literalToValue(prop.initializer);
    if (value !== undefined) {
      result[name] = value;
    }
  }
  return result;
}

function literalToValue(node) {
  const stripped = stripAsExpressions(node);
  if (!stripped) return undefined;

  if (ts.isStringLiteralLike(stripped)) {
    return stripped.text;
  }

  if (ts.isObjectLiteralExpression(stripped)) {
    return objectLiteralToObject(stripped);
  }

  return undefined;
}

function resolvePropertyAccess(constantMap, expression) {
  const segments = [];
  let current = expression;
  while (ts.isPropertyAccessExpression(current)) {
    segments.unshift(current.name.text);
    current = current.expression;
  }
  if (!ts.isIdentifier(current)) {
    return undefined;
  }
  const root = current.text;
  let value = constantMap.get(root);
  if (value === undefined) {
    return undefined;
  }
  for (const segment of segments) {
    if (value && typeof value === 'object' && segment in value) {
      value = value[segment];
    } else {
      return undefined;
    }
  }
  return typeof value === 'string' ? value : undefined;
}

function resolveI18nString(constantMap, expression) {
  const stripped = stripAsExpressions(expression);
  if (!stripped) return undefined;

  if (ts.isStringLiteralLike(stripped)) {
    return stripped.text;
  }

  if (ts.isPropertyAccessExpression(stripped)) {
    return resolvePropertyAccess(constantMap, stripped);
  }

  return undefined;
}

const translationFunctionNames = new Set(['t', 'tc']);
function createSourceFileFromContent(fileName, content, scriptKind = ts.ScriptKind.TSX) {
  return ts.createSourceFile(fileName, content, ts.ScriptTarget.Latest, true, scriptKind);
}

function collectTranslationKeysFromSource(sourceFile, keys) {
  const visit = (node) => {
    if (ts.isCallExpression(node) && node.arguments.length > 0) {
      let functionName;

      const expression = node.expression;
      if (ts.isIdentifier(expression)) {
        functionName = expression.text;
      } else if (ts.isPropertyAccessExpression(expression)) {
        functionName = expression.name.text;
      }

      if (functionName && translationFunctionNames.has(functionName)) {
        const firstArg = stripAsExpressions(node.arguments[0]);
        if (firstArg && ts.isStringLiteralLike(firstArg)) {
          keys.add(firstArg.text);
        }
      }
    }

    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
}

function detectScriptKind(filePath) {
  if (filePath.endsWith('.tsx')) return ts.ScriptKind.TSX;
  if (filePath.endsWith('.ts')) return ts.ScriptKind.TS;
  if (filePath.endsWith('.jsx')) return ts.ScriptKind.JSX;
  return ts.ScriptKind.JS;
}

async function collectTsTranslationKeys() {
  const sourceRoot = path.resolve(process.cwd(), 'src');
  const ignorePatterns = [
    '**/__tests__/**',
    '**/__test__/**',
    '**/*.spec.ts',
    '**/*.spec.tsx',
    '**/*.spec.js',
    '**/*.spec.jsx',
    '**/*.test.ts',
    '**/*.test.tsx',
    '**/*.test.js',
    '**/*.test.jsx',
  ];

  let scriptFiles = [];
  try {
    scriptFiles = await glob('**/*.{ts,tsx,js,jsx}', {
      cwd: sourceRoot,
      ignore: ignorePatterns,
      absolute: true,
    });
  } catch (error) {
    console.warn('[i18n] Failed to enumerate TS source files for translation keys.', error);
    return new Set();
  }

  let vueFiles = [];
  try {
    vueFiles = await glob('**/*.vue', {
      cwd: sourceRoot,
      ignore: ignorePatterns,
      absolute: true,
    });
  } catch (error) {
    console.warn('[i18n] Failed to enumerate Vue files for translation keys.', error);
  }

  const keys = new Set();

  await Promise.all(
    scriptFiles.map(async (file) => {
      try {
        const content = await readFile(file, 'utf8');
        const kind = detectScriptKind(file);
        const sourceFile = createSourceFileFromContent(file, content, kind);
        collectTranslationKeysFromSource(sourceFile, keys);
      } catch (error) {
        console.warn(`[i18n] Failed to process ${file} for translation keys.`, error);
      }
    })
  );

  await Promise.all(
    vueFiles.map(async (file) => {
      try {
        const content = await readFile(file, 'utf8');
        const { descriptor } = parse(content, { filename: file });

        if (descriptor.script) {
          const lang = descriptor.script.lang || 'ts';
          const kind = detectScriptKind(
            `file.${lang === 'tsx' ? 'tsx' : lang === 'ts' ? 'ts' : lang === 'jsx' ? 'jsx' : 'js'}`
          );
          const sourceFile = createSourceFileFromContent(file, descriptor.script.content, kind);
          collectTranslationKeysFromSource(sourceFile, keys);
        }

        if (descriptor.scriptSetup) {
          const lang = descriptor.scriptSetup.lang || 'ts';
          const kind = detectScriptKind(
            `file.${lang === 'tsx' ? 'tsx' : lang === 'ts' ? 'ts' : lang === 'jsx' ? 'jsx' : 'js'}`
          );
          const sourceFile = createSourceFileFromContent(
            `${file}?setup`,
            descriptor.scriptSetup.content,
            kind
          );
          collectTranslationKeysFromSource(sourceFile, keys);
        }
      } catch (error) {
        console.warn(`[i18n] Failed to process ${file} for Vue translation keys.`, error);
      }
    })
  );

  return keys;
}

async function collectJsonFormsKeys() {
  const apiSourceRoot = path.resolve(process.cwd(), '../api/src');
  const ignorePatterns = [
    '**/__tests__/**',
    '**/__test__/**',
    '**/*.spec.ts',
    '**/*.spec.js',
    '**/*.test.ts',
    '**/*.test.js',
  ];

  let files = [];
  try {
    files = await glob('**/*.ts', {
      cwd: apiSourceRoot,
      ignore: ignorePatterns,
      absolute: true,
    });
  } catch (error) {
    console.warn('[i18n] Failed to enumerate API source files for jsonforms keys.', error);
    return { keys: new Set(), descriptions: new Map() };
  }

  const keys = new Set();
  const descriptionValues = new Map();
  const labelValues = new Map();
  await Promise.all(
    files.map(async (file) => {
      try {
        const content = await readFile(file, 'utf8');
        const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);

        const constantMap = new Map();

        const recordConstants = (node) => {
          if (ts.isVariableStatement(node)) {
            for (const declaration of node.declarationList.declarations) {
              if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
                continue;
              }
              const stripped = stripAsExpressions(declaration.initializer);
              if (!stripped) {
                continue;
              }
              if (ts.isObjectLiteralExpression(stripped)) {
                const obj = objectLiteralToObject(stripped);
                if (obj && Object.keys(obj).length > 0) {
                  constantMap.set(declaration.name.text, obj);
                }
              }
            }
          }
          ts.forEachChild(node, recordConstants);
        };

        recordConstants(sourceFile);

        const visit = (node) => {
          if (ts.isPropertyAssignment(node) && getPropertyName(node.name) === 'i18n') {
            const key = resolveI18nString(constantMap, node.initializer);
            if (key && key.startsWith('jsonforms.')) {
              expandJsonFormsKey(key).forEach((expandedKey) => keys.add(expandedKey));

              const parent = node.parent;
              if (ts.isObjectLiteralExpression(parent)) {
                let labelCandidate;
                const allowDescriptionExtraction = !key.endsWith('.description');

                for (const prop of parent.properties) {
                  if (!ts.isPropertyAssignment(prop)) {
                    continue;
                  }
                  const propName = getPropertyName(prop.name);
                  if (propName === 'description' && allowDescriptionExtraction) {
                    const descriptionValue = resolveI18nString(constantMap, prop.initializer);
                    if (typeof descriptionValue === 'string' && descriptionValue.length > 0) {
                      const descriptionKey = `${key}.description`;
                      keys.add(descriptionKey);
                      descriptionValues.set(descriptionKey, descriptionValue);
                    }
                    continue;
                  }
                  if (
                    !labelCandidate &&
                    (propName === 'label' || propName === 'text' || propName === 'title')
                  ) {
                    const resolved = resolveI18nString(constantMap, prop.initializer);
                    if (typeof resolved === 'string' && resolved.length > 0) {
                      labelCandidate = resolved;
                    }
                  }
                }

                if (typeof labelCandidate === 'string' && labelCandidate.length > 0) {
                  const labelKey = key.endsWith('.label') ? key : `${key}.label`;
                  keys.add(labelKey);
                  labelValues.set(labelKey, labelCandidate);
                }
              }
            }
          } else if (ts.isStringLiteralLike(node)) {
            const text = node.text;
            if (text.startsWith('jsonforms.')) {
              expandJsonFormsKey(text).forEach((key) => keys.add(key));
            }
          }
          ts.forEachChild(node, visit);
        };

        visit(sourceFile);
      } catch (error) {
        console.warn(`[i18n] Failed to process ${file} for jsonforms keys.`, error);
      }
    })
  );

  return { keys, descriptions: descriptionValues, labels: labelValues };
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

  const {
    keys: jsonFormsKeys,
    descriptions: jsonFormsDescriptions,
    labels: jsonFormsLabels,
  } = await collectJsonFormsKeys();
  jsonFormsKeys.forEach((key) => englishMissing.add(key));

  const tsTranslationKeys = await collectTsTranslationKeys();
  tsTranslationKeys.forEach((key) => englishMissing.add(key));

  const missingValuePlaceholder = null;

  let englishUpdated = false;
  let addedEnglish = 0;
  for (const key of englishMissing) {
    if (!(key in englishData)) {
      let value = missingValuePlaceholder;

      if (key.endsWith('.label')) {
        const baseKey = key.slice(0, -'.label'.length);
        const baseValue = englishData[baseKey];
        if (typeof baseValue === 'string' && baseValue.length > 0) {
          value = baseValue;
        } else if (jsonFormsLabels.has(key)) {
          value = jsonFormsLabels.get(key);
        }
      } else if (jsonFormsDescriptions.has(key)) {
        value = jsonFormsDescriptions.get(key);
      }

      englishData[key] = value;
      addedEnglish += 1;
    }
  }

  if (addedEnglish > 0) {
    englishUpdated = true;
  }

  const protectedKeys = new Set([
    ...jsonFormsKeys,
    ...jsonFormsDescriptions.keys(),
    ...jsonFormsLabels.keys(),
    ...tsTranslationKeys,
  ]);
  const maybeDynamicKeys = new Set((report?.maybeDynamicKeys ?? []).map((entry) => entry.path));
  const englishLanguageKey = 'en';
  const englishUnusedKeys = new Set(
    (report?.unusedKeys ?? [])
      .filter((entry) => entry.language === englishLanguageKey)
      .map((entry) => entry.path)
  );

  let removedEnglish = 0;
  if (englishUnusedKeys.size > 0) {
    for (const key of Object.keys(englishData)) {
      if (!englishUnusedKeys.has(key)) {
        continue;
      }
      if (protectedKeys.has(key)) {
        continue;
      }
      if (maybeDynamicKeys.has(key)) {
        continue;
      }
      delete englishData[key];
      removedEnglish += 1;
    }
  }

  if (removedEnglish > 0) {
    englishUpdated = true;
  }

  if (englishUpdated) {
    await writeJson(englishDescriptor.absPath, englishData);
  }

  if (addedEnglish === 0 && removedEnglish === 0) {
    console.log('[i18n] No translation updates required for English locale.');
    return;
  }

  if (addedEnglish > 0) {
    console.log(`[i18n] Added ${addedEnglish} key(s) to ${englishFileName}.`);
  }

  if (removedEnglish > 0) {
    console.log(`[i18n] Removed ${removedEnglish} unused key(s) from ${englishFileName}.`);
  }
}

main().catch((error) => {
  console.error('[i18n] Failed to extract translations.', error);
  process.exitCode = 1;
});
