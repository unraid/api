import { buildSchema } from 'graphql';
import { readFileSync } from 'fs';
import { join } from 'path';

async function validateSchema(schemaFile = 'generated-schema.graphql') {
    try {
        // Read the generated schema file
        const schemaPath = join(process.cwd(), schemaFile);
        const schemaContent = readFileSync(schemaPath, 'utf-8');

        // Try to build the schema
        const schema = buildSchema(schemaContent);

        // If we get here, the schema is valid
        console.log(`✅ ${schemaFile} is valid!`);
        
        // Print some basic schema information
        const queryType = schema.getQueryType();
        const mutationType = schema.getMutationType();
        const subscriptionType = schema.getSubscriptionType();

        console.log('\nSchema Overview:');
        console.log('----------------');
        if (queryType) {
            console.log(`Query Type: ${queryType.name}`);
            console.log('Query Fields:', Object.keys(queryType.getFields()).join(', '));
        }
        if (mutationType) {
            console.log(`\nMutation Type: ${mutationType.name}`);
            console.log('Mutation Fields:', Object.keys(mutationType.getFields()).join(', '));
        }
        if (subscriptionType) {
            console.log(`\nSubscription Type: ${subscriptionType.name}`);
            console.log('Subscription Fields:', Object.keys(subscriptionType.getFields()).join(', '));
        }

    } catch (error) {
        console.error('❌ Schema validation failed!');
        console.error('\nError details:');
        console.error('----------------');
        console.error(error);
        
        // If it's a GraphQL error, try to extract more information
        if (error instanceof Error) {
            const message = error.message;
            if (message.includes('Cannot determine a GraphQL output type')) {
                console.error('\nPossible causes:');
                console.error('1. Missing @Field() decorator on a type field');
                console.error('2. Unregistered enum type');
                console.error('3. Circular dependency in type definitions');
                console.error('\nLook for fields named "type" in your GraphQL types');
            }
        }
    }
}

// Run the validation
validateSchema('generated-schema.graphql').catch(console.error);
validateSchema('generated-schema-new.graphql').catch(console.error); 