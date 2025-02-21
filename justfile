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
