module.exports = function (path, mergeGraphqlSchemas) {
    const { join } = path;
    const { fileLoader, mergeTypes } = mergeGraphqlSchemas;

    return mergeTypes(fileLoader(join(__dirname, './types/**/*.graphql')), {
        all: true
    });
}
