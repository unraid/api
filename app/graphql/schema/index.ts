/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { join } from 'path';
import { mergeTypeDefs } from '@graphql-tools/merge';
import { loadFilesSync } from '@graphql-tools/load-files';

const files = loadFilesSync(join(__dirname, './types/**/*.graphql'));

export const typeDefs = mergeTypeDefs(files);
