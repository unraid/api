# Copy full version into package.json

export GIT_SHA_SHORT=$(git rev-parse --short HEAD)
export GIT_TAG=$(git describe --tags --abbrev=0)
if git describe --tags --abbrev=0 --exact-match; then export EXACT_TAG="TRUE"; else export EXACT_TAG="FALSE"; fi;
    echo $EXACT_TAG

if [ "$EXACT_TAG" = "TRUE" ]
then
    echo 'Setting up package.json with just semvar'
    VERSION=$(jq -r .version package.json)
    jq --arg version $VERSION '.fullVersion = $version' package.json > out.json && mv out.json package.json
    echo '✔ Version field updated'
else
    echo 'Setting up package.json with semvar and sha'
    VERSION=$(jq -r .version package.json) && \
    jq --arg version $VERSION-$GIT_SHA_SHORT '.fullVersion = $version' package.json > out.json && mv out.json package.json
    echo '✔ Version field updated'
fi;