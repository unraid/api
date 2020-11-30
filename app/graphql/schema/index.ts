/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { join } from 'path';
import { fileLoader, mergeTypes } from 'merge-graphql-schemas';

const files = fileLoader(join(__dirname, './types/**/*.graphql'));

export const typeDefs = mergeTypes(files, {
	all: true
});
