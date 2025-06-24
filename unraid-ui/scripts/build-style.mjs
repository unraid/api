import fs from 'fs/promises';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';
import postcssImport from 'postcss-import';
import tailwindcss from '@tailwindcss/postcss';

/**
 * Helper script for storybook to build the CSS file for the components. This is used to ensure that modals render using the shadow styles.
 */

process.env.VITE_TAILWIND_BASE_FONT_SIZE = 16;

const inputPath = './src/styles/index.css';
const outputPath = './.storybook/static/index.css'; // served from root: /index.css

const css = await fs.readFile(inputPath, 'utf8');

const result = await postcss([
  postcssImport(),
  tailwindcss({ config: './tailwind.config.ts' }),
  autoprefixer(),
]).process(css, {
  from: inputPath,
  to: outputPath,
});

await fs.mkdir('./.storybook/static', { recursive: true });
await fs.writeFile(outputPath, result.css);

console.log('✅ CSS built for Storybook:', outputPath);