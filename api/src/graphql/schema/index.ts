import { join } from 'path';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';

const files = loadFilesSync(join(__dirname, '../src/graphql/schema/types'), { extensions: ['graphql'] });

export const typeDefs = mergeTypeDefs(files);
