/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

module.exports = function (path, mergeGraphqlSchemas) {
	const {join} = path;
	const {fileLoader, mergeTypes} = mergeGraphqlSchemas;
	const files = fileLoader(join(__dirname, './types/**/*.graphql'));

	return mergeTypes(files, {
		all: true
	});
};
