module.exports = function (deepmerge, GraphQLJSON, GraphQLLong, GraphQLUUID) {
	return deepmerge.all([
		{
			JSON: GraphQLJSON,
			Long: GraphQLLong,
			UUID: GraphQLUUID
		}
	]);
};