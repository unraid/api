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

  // Create basic source files
  const indexContent = `import { Module, Logger, Inject } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ${pascalName}ConfigPersister } from "./config.persistence.js";
import { configFeature } from "./config.entity.js";
import { ${pascalName}Resolver } from "./${kebabName}.resolver.js";

export const adapter = "nestjs";

@Module({
  imports: [ConfigModule.forFeature(configFeature)],
  providers: [${pascalName}Resolver, ${pascalName}ConfigPersister],
})
class ${pascalName}PluginModule {
  logger = new Logger(${pascalName}PluginModule.name);

  constructor(
    @Inject(ConfigService) private readonly configService: ConfigService
  ) {}

  onModuleInit() {
    this.logger.log(
      "${pascalName} plugin initialized with %o",
      this.configService.get("${kebabName}")
    );
  }
}

export const ApiModule = ${pascalName}PluginModule;
`;

  await fs.writeFile(path.join(pluginDir, 'src', 'index.ts'), indexContent);

  // Create resolver template
  const resolverContent = `import { Resolver, Query, Mutation } from "@nestjs/graphql";
import { ConfigService } from "@nestjs/config";
import { ${pascalName}Config } from "./config.entity.js";

@Resolver()
export class ${pascalName}Resolver {
  constructor(private readonly configService: ConfigService) {}

  @Query(() => String)
  async ${pascalName}Status() {
    // Example query: Fetch a value from the config
    return this.configService.get("${kebabName}.enabled", true) ? "Enabled" : "Disabled";
  }

  @Mutation(() => Boolean)
  async toggle${pascalName}Status() {
    // Example mutation: Update a value in the config
    const currentStatus = this.configService.get("${kebabName}.enabled", true);
    const newStatus = !currentStatus;
    this.configService.set("${kebabName}.enabled", newStatus);
    // The config persister will automatically save the changes.
    return newStatus;
  }
}
`;

  await fs.writeFile(path.join(pluginDir, 'src', `${kebabName}.resolver.ts`), resolverContent);

  // Create config entity template
  const configEntityContent = `import { registerAs } from "@nestjs/config";
import { Field, ObjectType } from "@nestjs/graphql";
import { Exclude, Expose } from "class-transformer";
import { IsBoolean } from "class-validator";

@Exclude() // Exclude properties by default
@ObjectType()
export class ${pascalName}Config {
  @Expose() // Expose this property for transformation
  @Field(() => Boolean, { description: "Whether the plugin is enabled" })
  @IsBoolean()
  enabled!: boolean;
}

// This function provides the default config and registers it under the '${kebabName}' key.
export const configFeature = registerAs<${pascalName}Config>("${kebabName}", () => {
  return {
    enabled: true,
  };
});
`;

  await fs.writeFile(path.join(pluginDir, 'src', 'config.entity.ts'), configEntityContent);

  // Create config persister template
  const configPersisterContent = `import { Logger, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { existsSync, readFileSync, writeFile } from "fs";
import path from "path";
import { debounceTime } from "rxjs/operators";
import { ${pascalName}Config } from "./config.entity.js";

@Injectable()
export class ${pascalName}ConfigPersister {
  constructor(private readonly configService: ConfigService) {}

  private logger = new Logger(${pascalName}ConfigPersister.name);
  
  /** the file path to the config file for this plugin */
  get configPath() {
    return path.join(
      this.configService.get("CONFIG_MODULES_HOME")!, 
      '${kebabName}.json' // Use kebab-case for the filename
    );
  }

  onModuleInit() {
    this.logger.debug(\`Config path: \${this.configPath}\`);
    // Load the config from the file if it exists, otherwise initialize it with defaults.
    if (existsSync(this.configPath)) {
      try {
        const configFromFile = JSON.parse(readFileSync(this.configPath, "utf8"));
        this.configService.set("${kebabName}", configFromFile); 
        this.logger.verbose(\`Config loaded from \${this.configPath}\`);
      } catch (error) {
         this.logger.error(\`Error reading or parsing config file at \${this.configPath}. Using defaults.\`, error);
         // If loading fails, ensure default config is set and persisted
         this.persist();
      }
    } else {
      this.logger.log(\`Config file \${this.configPath} does not exist. Writing default config...\`);
      // Persist the default configuration provided by configFeature
      this.persist(); 
    }

    // Automatically persist changes to the config file after a short delay.
    const HALF_SECOND = 500;
    this.configService.changes$
      .pipe(debounceTime(HALF_SECOND))
      .subscribe({
        next: ({ newValue, oldValue, path: changedPath }) => {
          // Only persist if the change is within this plugin's config namespace
          if (changedPath.startsWith("${kebabName}.") && newValue !== oldValue) {
            this.logger.debug(\`Config changed: \${changedPath}\`, { newValue, oldValue });
            // Persist the entire config object for this plugin
            this.persist(); 
          }
        },
        error: (err) => {
          this.logger.error("Error subscribing to config changes:", err);
        },
      });
  }

  async persist(config = this.configService.get<${pascalName}Config>("${kebabName}")) {
    const data = JSON.stringify(config, null, 2);
    this.logger.verbose(\`Persisting config to \${this.configPath}: \${data}\`);
    writeFile(this.configPath, data, (err) => {
      if (err) {
        this.logger.error("Error writing config change to disk:", err);
      } else {
        this.logger.verbose(\`Config change persisted to \${this.configPath}\`);
      }
    });
  }
}
`;

  await fs.writeFile(path.join(pluginDir, 'src', 'config.persistence.ts'), configPersisterContent);
  return pluginDir;
} 
