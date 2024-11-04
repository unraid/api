import { join } from 'path';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';

console.log('Loading type definitions from ' + join(import.meta.dirname, './types'));
const files = loadFilesSync(join(import.meta.dirname, './types'), {
    extensions: ['graphql'],
});

export const typeDefs = mergeTypeDefs(files);