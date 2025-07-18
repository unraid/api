# The first recipe in a justfile is considered the default recipe,
# which means it runs when `just` is called with no arguments

default: list-commands

list-commands:
    @just --list --justfile {{justfile()}} --list-heading $'\nMonorepo recipes:\n'  

# Prepares the repo for development
setup:
    # ignore personal vscode settings. to contribute a change, use `just stop-ignore $file`
    @just ignore .vscode/settings.json api/.vscode/settings.json web/.vscode/settings.json
    # ignore api local-state files
    @just ignore api/dev/states/myservers.cfg api/dev/Unraid.net/myservers.cfg
    
    pnpm install

# Removes all node_modules directories in the repository
clean-modules:
    #!/usr/bin/env bash
    echo "Finding and removing all node_modules directories..."
    find . -name "node_modules" -type d -not -path "*/node_modules/*" | while read dir; do
        echo "Removing: $dir"
        rm -rf "$dir"
    done
    echo "All node_modules directories have been removed."

# Removes all build artifacts (dist, .nuxt, .output, coverage, etc.)
clean-build:
    #!/usr/bin/env bash
    echo "Finding and removing build artifacts..."
    build_dirs=("dist" ".nuxt" ".output" "coverage" "deploy")
    for build_dir in "${build_dirs[@]}"; do
        find . -name "$build_dir" -type d | while read dir; do
            echo "Removing: $dir"
            rm -rf "$dir"
        done
    done
    echo "All build artifacts have been removed."

# restore notification files under api/dev
restore-notifications:
    git checkout ./api/dev/notifications

# starts ignoring a file already tracked by git. (gitignore will not apply to these files)
[group('git')]
[no-cd]
ignore +files:
    #!/usr/bin/env bash
    for file in {{ files }}; do
        if [ ! -f "$file" ]; then
            echo "Warning: $file does not exist"
            continue
        fi
        git update-index --skip-worktree "$file"
    done

# resumes normal tracking of an ignored tracked file.
[group('git')]
[no-cd]
stop-ignoring file:
    git update-index --no-skip-worktree {{ file }}

# lists tracked files where further changes are being ignored.
[group('git')]
list-ignored:
    -git ls-files -v | grep '^S'

# Checks a node.js project's compliance with GPL-2.0-or-later.
[no-cd]
@compliance:
    pnpx license-checker --excludePrivatePackages --direct --production --onlyAllow="MIT;BSD-2-Clause;BSD-3-Clause;ISC;Apache-2.0;Zlib;X11;Python-2.0;Artistic-2.0;PostgreSQL;GPL-2.0-or-later;GPL-3.0;AGPL-3.0;LGPL-2.1;LGPL-3.0"
