# Copy full version into package.json

export GIT_SHA_SHORT=$(git rev-parse --short HEAD)
export GIT_TAG=$(git describe --tags --abbrev=0)
if git describe --tags --abbrev=0 --exact-match; 
then 
    export EXACT_TAG="TRUE"; 
else 
    export EXACT_TAG="FALSE"; 
fi;


if [ "$EXACT_TAG" = "TRUE" ]
then
    echo 'Setting up package.json with just semvar'
    VERSION=$(jq -r .version package.json)
    printf "export const version = '$VERSION';\nexport const fullVersion = '$VERSION';\n" > src/version.ts
    echo '✔ Version field updated'
else
    echo 'Setting up package.json with semvar and sha'
    VERSION=$(jq -r .version package.json) && \
    printf "export const version = '$VERSION';\nexport const fullVersion = '$VERSION-$GIT_SHA_SHORT';\n" > src/version.ts
    echo '✔ Version field updated'
fi;