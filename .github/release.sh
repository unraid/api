#!/usr/bin/env bash

# https://unix.stackexchange.com/a/9443/119653
reverse () {
    local line
    if IFS= read -r line
    then
        reverse
        printf '%s\n' "$line"
    fi
}

IS_TAG=$(git tag -l --points-at HEAD)
RELEASE_TAG=$(git describe --tags $(git rev-list --tags --max-count=1))
RELEASE=$(echo $RELEASE_TAG | awk -F- '{print $1}')
TIMESTAMP=$(date +%Y%m%d%H%M%S)
ROLLING_TAG="$RELEASE-rolling-$TIMESTAMP"
REPO=$(echo "${REPO#*/}")
ORG="unraid"

# If tag then upload files for the tag
if [[ ! -z "$IS_TAG" ]]; then
    # Compare to the last known semver version so we get the whole changelog
    LAST_RELEASE=$(git tag --list  --sort=v:refname | grep -v rolling | reverse | sed -n 2p)
    RELEASE_NOTES=$(git log "$LAST_RELEASE...HEAD~1" --pretty=format:"- %s [\`%h\`](http://github.com/$ORG/$REPO/commit/%H)" --reverse)
    
    # Add title and body
    printf "$RELEASE\n\n$RELEASE_NOTES" > release.md
    # Release
    if [[ $* == *--dry* ]]; then
        echo "Type: Release"
        echo "Tag: $RELEASE_TAG"
        echo "Release: $LAST_RELEASE"
        echo "----------"
        cat release.md
    else
        hub release create -a unraid-$REPO-*.tgz -F release.md -p $RELEASE_TAG
    fi
else
    # Otherwise upload files to the rolling release

    # Create release notes
    RELEASE_NOTES=$(git log "$RELEASE_TAG...HEAD" --pretty=format:"- %s [\`%h\`](http://github.com/$ORG/$REPO/commit/%H)" --reverse)
    # Add title and body
    printf "$ROLLING_TAG\n\n$RELEASE_NOTES" > release.md
    # Release
    if [[ $* == *--dry* ]]; then
        echo "Type: Rolling"
        echo "Tag: $ROLLING_TAG"
        echo "Release: $RELEASE"
        echo "----------"
        cat release.md
    else
        hub release create -a unraid-$REPO-*.tgz -F release.md -p $ROLLING_TAG
    fi
fi