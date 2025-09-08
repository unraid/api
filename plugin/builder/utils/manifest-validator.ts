import { existsSync } from "fs";
import { readFile } from "fs/promises";
import { join, dirname } from "path";

export interface ManifestEntry {
  file: string;
  src?: string;
  css?: string[];
  assets?: string[];
  imports?: string[];
  dynamicImports?: string[];
  isDynamicEntry?: boolean;
  isEntry?: boolean;
}

export interface StandaloneManifest {
  [key: string]: ManifestEntry | number;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  manifest?: StandaloneManifest;
}

/**
 * Validates a standalone.manifest.json file and checks that all referenced files exist
 * @param manifestPath - Path to the manifest file
 * @returns Validation result with errors and warnings
 */
export async function validateStandaloneManifest(manifestPath: string): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if manifest file exists
  if (!existsSync(manifestPath)) {
    return {
      isValid: false,
      errors: [`Manifest file does not exist: ${manifestPath}`],
      warnings,
    };
  }

  let manifest: StandaloneManifest;
  
  try {
    const content = await readFile(manifestPath, "utf-8");
    manifest = JSON.parse(content);
  } catch (error) {
    return {
      isValid: false,
      errors: [`Failed to parse manifest JSON: ${error.message}`],
      warnings,
    };
  }

  // Get the directory containing the manifest
  // Files should be relative to the manifest location
  const manifestDir = dirname(manifestPath);
  
  // Track which files were checked to avoid duplicates
  const checkedFiles = new Set<string>();
  
  // Validate each entry in the manifest
  for (const [key, value] of Object.entries(manifest)) {
    // Skip the timestamp field
    if (key === "ts" && typeof value === "number") {
      continue;
    }
    
    // Skip if not a manifest entry
    if (typeof value !== "object" || !value || !("file" in value)) {
      warnings.push(`Skipping non-entry field: ${key}`);
      continue;
    }
    
    const entry = value as ManifestEntry;
    
    // Check main file
    if (entry.file) {
      const filePath = join(manifestDir, entry.file);
      if (!checkedFiles.has(filePath)) {
        checkedFiles.add(filePath);
        if (!existsSync(filePath)) {
          errors.push(`Missing file referenced in manifest: ${entry.file}`);
        }
      }
    }
    
    // Check CSS files
    if (entry.css && Array.isArray(entry.css)) {
      for (const cssFile of entry.css) {
        const cssPath = join(manifestDir, cssFile);
        if (!checkedFiles.has(cssPath)) {
          checkedFiles.add(cssPath);
          if (!existsSync(cssPath)) {
            errors.push(`Missing CSS file referenced in manifest: ${cssFile}`);
          }
        }
      }
    }
    
    // Check asset files
    if (entry.assets && Array.isArray(entry.assets)) {
      for (const assetFile of entry.assets) {
        const assetPath = join(manifestDir, assetFile);
        if (!checkedFiles.has(assetPath)) {
          checkedFiles.add(assetPath);
          if (!existsSync(assetPath)) {
            errors.push(`Missing asset file referenced in manifest: ${assetFile}`);
          }
        }
      }
    }
    
    // Check imports
    if (entry.imports && Array.isArray(entry.imports)) {
      for (const importFile of entry.imports) {
        const importPath = join(manifestDir, importFile);
        if (!checkedFiles.has(importPath)) {
          checkedFiles.add(importPath);
          if (!existsSync(importPath)) {
            warnings.push(`Missing import file referenced in manifest: ${importFile} (this may be okay if it's a virtual import)`);
          }
        }
      }
    }
  }
  
  // Check for required entries
  const hasJsEntry = Object.values(manifest).some(
    (entry) => typeof entry === "object" && entry?.file?.endsWith(".js")
  );
  
  if (!hasJsEntry) {
    errors.push("Manifest must contain at least one JavaScript entry file");
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    manifest,
  };
}

/**
 * Gets the path to the standalone manifest file in a directory
 * @param dir - Directory to search in
 * @returns Path to the manifest file or null if not found
 */
export function getStandaloneManifestPath(dir: string): string | null {
  // Check standalone subdirectory first (preferred location)
  const standaloneManifest = join(dir, "standalone", "standalone.manifest.json");
  if (existsSync(standaloneManifest)) {
    return standaloneManifest;
  }
  
  // Check root directory for backwards compatibility
  const rootManifest = join(dir, "standalone.manifest.json");
  if (existsSync(rootManifest)) {
    return rootManifest;
  }
  
  // Check nuxt subdirectory for backwards compatibility
  const nuxtManifest = join(dir, "nuxt", "standalone.manifest.json");
  if (existsSync(nuxtManifest)) {
    return nuxtManifest;
  }
  
  return null;
}