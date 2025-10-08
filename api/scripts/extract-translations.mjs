#!/usr/bin/env node

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { glob } from 'glob';
import ts from 'typescript';

const projectRoot = process.cwd();
const sourcePatterns = 'src/**/*.{ts,js}';
const ignorePatterns = [
  '**/__tests__/**',
  '**/__test__/**',
  '**/*.spec.ts',
  '**/*.spec.js',
  '**/*.test.ts',
  '**/*.test.js',
];

const englishLocaleFile = path.resolve(projectRoot, 'src/i18n/en.json');

const identifierTargets = new Set(['t', 'translate']);
const propertyTargets = new Set([
  'i18n.t',
  'i18n.translate',
  'ctx.t',
  'this.translate',
  'this.i18n.translate',
  'this.i18n.t',
]);

function getPropertyChain(node) {
  if (ts.isIdentifier(node)) {
    return node.text;
  }
  if (ts.isPropertyAccessExpression(node)) {
    const left = getPropertyChain(node.expression);
    if (!left) return undefined;
    return `${left}.${node.name.text}`;
  }
  return undefined;
}

function extractLiteral(node) {
  if (ts.isStringLiteralLike(node)) {
    return node.text;
  }
  if (ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text;
  }
  return undefined;
}

function collectKeysFromSource(sourceFile) {
  const keys = new Set();

  function visit(node) {
    if (ts.isCallExpression(node)) {
      const expr = node.expression;
      let matches = false;

      if (ts.isIdentifier(expr) && identifierTargets.has(expr.text)) {
        matches = true;
      } else if (ts.isPropertyAccessExpression(expr)) {
        const chain = getPropertyChain(expr);
        if (chain && propertyTargets.has(chain)) {
          matches = true;
        }
      }

      if (matches) {
        const [firstArg] = node.arguments;
        if (firstArg) {
          const literal = extractLiteral(firstArg);
          if (literal) {
            keys.add(literal);
          }
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return keys;
}

async function loadEnglishCatalog() {
  try {
    const raw = await readFile(englishLocaleFile, 'utf8');
    const parsed = raw.trim() ? JSON.parse(raw) : {};
    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error('English locale file must contain a JSON object.');
    }
    return parsed;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return {};
    }
    throw error;
  }
}

async function ensureEnglishCatalog(keys) {
  const existingCatalog = await loadEnglishCatalog();
  const existingKeys = new Set(Object.keys(existingCatalog));

  let added = 0;
  const combinedKeys = new Set([...existingKeys, ...keys]);
  const sortedKeys = Array.from(combinedKeys).sort((a, b) => a.localeCompare(b));
  const nextCatalog = {};

  for (const key of sortedKeys) {
    if (Object.prototype.hasOwnProperty.call(existingCatalog, key)) {
      nextCatalog[key] = existingCatalog[key];
    } else {
      nextCatalog[key] = key;
      added += 1;
    }
  }

  const nextJson = `${JSON.stringify(nextCatalog, null, 2)}\n`;
  const existingJson = JSON.stringify(existingCatalog, null, 2) + '\n';

  if (nextJson !== existingJson) {
    await writeFile(englishLocaleFile, nextJson, 'utf8');
  }

  return added;
}

async function main() {
  const files = await glob(sourcePatterns, {
    cwd: projectRoot,
    ignore: ignorePatterns,
    absolute: true,
  });

  const collectedKeys = new Set();

  await Promise.all(
    files.map(async (file) => {
      const content = await readFile(file, 'utf8');
      const sourceFile = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
      const keys = collectKeysFromSource(sourceFile);
      keys.forEach((key) => collectedKeys.add(key));
    }),
  );

  const added = await ensureEnglishCatalog(collectedKeys);

  if (added === 0) {
    console.log('[i18n] No new backend translation keys detected.');
  } else {
    console.log(`[i18n] Added ${added} key(s) to src/i18n/en.json.`);
  }
}

main().catch((error) => {
  console.error('[i18n] Failed to extract backend translations.', error);
  process.exitCode = 1;
});
