/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

module.exports = function (deepmerge, GraphQLJSON, GraphQLLong, GraphQLUUID) {
	return deepmerge.all([
		{
			JSON: GraphQLJSON,
			Long: GraphQLLong,
			UUID: GraphQLUUID
		}
	]);
};