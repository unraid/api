#!/usr/bin/env node
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { glob } from 'glob';
import nunjucks from 'nunjucks';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');
const templatesDir = path.join(rootDir, 'test-pages');
const pagesDir = path.join(templatesDir, 'pages');
const outputDir = path.join(rootDir, 'public', 'test-pages');

const env = nunjucks.configure(templatesDir, {
  autoescape: false,
  noCache: true,
  throwOnUndefined: false,
});

async function ensureDir(dirPath) {
  await mkdir(dirPath, { recursive: true });
}

async function renderTemplates() {
  const templateFiles = await glob('**/*.njk', { cwd: pagesDir, nodir: true });

  if (templateFiles.length === 0) {
    console.log('No test page templates found.');
    return;
  }

  await ensureDir(outputDir);

  const mode = process.env.NODE_ENV ?? 'development';

  let renderedCount = 0;
  for (const relativePath of templateFiles) {
    const templateName = `pages/${relativePath}`.replace(/\\/g, '/');
    const htmlOutput = env.render(templateName, { mode });
    const targetPath = path.join(outputDir, relativePath).replace(/\.njk$/, '.html');

    await ensureDir(path.dirname(targetPath));
    await writeFile(targetPath, htmlOutput, 'utf-8');
    renderedCount += 1;
  }

  console.log(
    `Rendered ${renderedCount} test page template${renderedCount === 1 ? '' : 's'} to ${outputDir}`
  );
}

renderTemplates().catch((error) => {
  console.error('Failed to render test page templates:', error);
  process.exit(1);
});
