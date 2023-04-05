/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { join } from 'path';
import { loadFilesSync } from '@graphql-tools/load-files';
import { mergeTypeDefs } from '@graphql-tools/merge';

const files = loadFilesSync(join(__dirname, '../src/graphql/schema/types'), { extensions: ['graphql'] });

export const typeDefs = mergeTypeDefs(files);
