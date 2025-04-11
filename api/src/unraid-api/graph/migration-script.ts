/**
 * This script helps with the migration from schema-first to code-first approach.
 * It identifies which resolvers need to be migrated and provides guidance on the migration process.
 *
 * To use this script:
 * 1. Run it with Node.js: `node migration-script.js`
 * 2. Follow the guidance provided by the script
 */

import fs from 'fs';
import path from 'path';

const __dirname = import.meta.dirname;
// Paths
const schemaDir = path.resolve(__dirname, '../../graphql/schema/types');
const resolversDir = path.resolve(__dirname, './resolvers');

// Get all schema directories
const schemaDirs = fs
    .readdirSync(schemaDir)
    .filter((item) => fs.statSync(path.join(schemaDir, item)).isDirectory())
    .filter((item) => item !== 'array' && item !== 'disks'); // Exclude special cases

// Get all resolver directories
const resolverDirs = fs
    .readdirSync(resolversDir)
    .filter((item) => fs.statSync(path.join(resolversDir, item)).isDirectory());

// Find resolvers that need to be migrated
const resolversToMigrate = schemaDirs.filter((dir) => {
    const resolverDir = path.join(resolversDir, dir);
    return (
        !fs.existsSync(resolverDir) ||
        !fs.readdirSync(resolverDir).some((file) => file.endsWith('.model.ts'))
    );
});

// Find resolvers that have already been migrated
const migratedResolvers = schemaDirs.filter((dir) => {
    const resolverDir = path.join(resolversDir, dir);
    return (
        fs.existsSync(resolverDir) &&
        fs.readdirSync(resolverDir).some((file) => file.endsWith('.model.ts'))
    );
});

// Print migration status
console.log('=== GraphQL Schema Migration Status ===');
console.log(`Total schema directories: ${schemaDirs.length}`);
console.log(`Migrated resolvers: ${migratedResolvers.length}`);
console.log(`Resolvers to migrate: ${resolversToMigrate.length}`);

// Print migrated resolvers
console.log('\n=== Migrated Resolvers ===');
migratedResolvers.forEach((resolver) => {
    console.log(`✅ ${resolver}`);
});

// Print resolvers to migrate
console.log('\n=== Resolvers to Migrate ===');
resolversToMigrate.forEach((resolver) => {
    console.log(`❌ ${resolver}`);
});

// Print migration guidance
console.log('\n=== Migration Guidance ===');
console.log('For each resolver to migrate:');
console.log('1. Create a model file (e.g., resolver-name.model.ts)');
console.log('2. Define ObjectType classes for return types');
console.log('3. Define InputType classes for input parameters');
console.log('4. Update the resolver to use the new model classes');
console.log('5. Update the resolver decorators to use the new model classes');
console.log('6. Create a module file (e.g., resolver-name.module.ts)');
console.log('7. Test the resolver to ensure it works correctly');

// Print example migration
console.log('\n=== Example Migration ===');
console.log('See migration-plan.md for detailed examples');

// Print next steps
console.log('\n=== Next Steps ===');
if (resolversToMigrate.length > 0) {
    console.log(`Start migrating the ${resolversToMigrate.length} resolvers listed above`);
} else {
    console.log('All resolvers have been migrated!');
    console.log('Next: Update the GraphQL module configuration to use code-first approach');
    console.log('Then: Remove the schema files');
}
