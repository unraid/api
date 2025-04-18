import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { pascalCase, kebabCase } from 'change-case';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function createPlugin(pluginName: string, targetDir: string = process.cwd()) {
  const pascalName = pascalCase(pluginName);
  const kebabName = kebabCase(pluginName);
  const packageName = `unraid-api-plugin-${kebabName}`;
  const pluginDir = path.join(targetDir, packageName);
  
  // Check if directory already exists
  if (await fs.pathExists(pluginDir)) {
    throw new Error(`Directory ${pluginDir} already exists`);
  }

  // Create directory structure
  await fs.ensureDir(path.join(pluginDir, 'src'));

  // Create package.json
  const packageJson = {
    name: packageName,
    version: "1.0.0",
    main: "dist/index.js",
    type: "module",
    files: ["dist"],
    scripts: {
      test: "echo \"Error: no test specified\" && exit 1",
      build: "tsc",
      prepare: "npm run build"
    },
    keywords: [],
    license: "GPL-2.0-or-later",
    description: `Plugin for Unraid API: ${pascalName}`,
    devDependencies: {
      "@nestjs/common": "^11.0.11",
      "@nestjs/config": "^4.0.2",
      "@nestjs/core": "^11.0.11",
      "@nestjs/graphql": "^13.0.3",
      "@types/ini": "^4.1.1",
      "@types/node": "^22.14.0",
      "camelcase-keys": "^9.1.3",
      "class-transformer": "^0.5.1",
      "class-validator": "^0.14.1",
      "ini": "^5.0.0",
      "nest-authz": "^2.14.0",
      "rxjs": "^7.8.2",
      "typescript": "^5.8.2",
      "zod": "^3.23.8"
    },
    peerDependencies: {
      "@nestjs/common": "^11.0.11",
      "@nestjs/config": "^4.0.2",
      "@nestjs/core": "^11.0.11",
      "@nestjs/graphql": "^13.0.3",
      "camelcase-keys": "^9.1.3",
      "class-transformer": "^0.5.1",
      "class-validator": "^0.14.1",
      "ini": "^5.0.0",
      "nest-authz": "^2.14.0",
      "rxjs": "^7.8.2",
      "zod": "^3.23.8"
    }
  };

  await fs.writeJson(path.join(pluginDir, 'package.json'), packageJson, { spaces: 2 });

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      sourceMap: true,
      forceConsistentCasingInFileNames: true,
      experimentalDecorators: true,
      emitDecoratorMetadata: true,
      esModuleInterop: true,
      strict: true,
      outDir: "dist",
      rootDir: "src"
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist"]
  };

  await fs.writeJson(path.join(pluginDir, 'tsconfig.json'), tsconfig, { spaces: 2 });

  // Read template files and replace variables
  const templatesDir = path.join(__dirname, '../src/templates');

  const replaceNames = (template: string) => {
    return template
    .replace(/\{\{pascalName\}\}/g, pascalName)
    .replace(/\{\{kebabName\}\}/g, kebabName);
  };
  
  // Create index.ts from template
  const indexTemplate = await fs.readFile(path.join(templatesDir, 'index.ts.template'), 'utf8');
  const indexContent = replaceNames(indexTemplate);
  await fs.writeFile(path.join(pluginDir, 'src', 'index.ts'), indexContent);

  // Create resolver from template
  const resolverTemplate = await fs.readFile(path.join(templatesDir, 'resolver.ts.template'), 'utf8');
  const resolverContent = replaceNames(resolverTemplate);
  await fs.writeFile(path.join(pluginDir, 'src', `${kebabName}.resolver.ts`), resolverContent);

  // Create config entity from template
  const configEntityTemplate = await fs.readFile(path.join(templatesDir, 'config.entity.ts.template'), 'utf8');
  const configEntityContent = replaceNames(configEntityTemplate);
  await fs.writeFile(path.join(pluginDir, 'src', 'config.entity.ts'), configEntityContent);

  // Create config persister from template
  const configPersisterTemplate = await fs.readFile(path.join(templatesDir, 'config.persistence.ts.template'), 'utf8');
  const configPersisterContent = replaceNames(configPersisterTemplate);
  await fs.writeFile(path.join(pluginDir, 'src', 'config.persistence.ts'), configPersisterContent);

  return pluginDir;
} 
