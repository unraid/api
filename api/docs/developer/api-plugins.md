# Working with API plugins

Under the hood, API plugins (i.e. plugins to the `@unraid/api` project) are represented
as npm `peerDependencies`. This is npm's intended package plugin mechanism, and given that
peer dependencies are installed by default as of npm v7, it supports bi-directional plugin functionality,
where the API provides dependencies for the plugin while the plugin provides functionality to the API.

## Private Workspace plugins

### Adding a local workspace package as an API plugin

The challenge with local workspace plugins is that they aren't available via npm during production.
To solve this, we vendor them inside `dist/plugins`. To prevent the build from breaking, however,
you should mark the workspace dependency as optional. For example:

```json
{
    "peerDependencies": {
        "unraid-api-plugin-connect": "workspace:*"
    },
    "peerDependenciesMeta": {
        "unraid-api-plugin-connect": {
            "optional": true
        }
    },
}
```

By marking the workspace dependency "optional", npm will not attempt to install it.
Thus, even though the "workspace:*" identifier will be invalid during build-time and run-time,
it will not cause problems.
