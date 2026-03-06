# @unraid/api

## Installation

Install the production plugin via the apps tab (search for "Unraid Connect")

Manual install can be done with the following routes:
[production](https://stable.dl.unraid.net/unraid-api/dynamix.unraid.net.plg)
[staging](https://preview.dl.unraid.net/unraid-api/dynamix.unraid.net.staging.plg)

## CLI

If you're on a unraid v6.9.2 or later machine this should be available by running `unraid-api` in any directory.

```bash
root@Devon:~# unraid-api

Unraid API

  Thanks for using the official Unraid API

Usage:

  $ unraid-api command <options>

Commands:

  start/stop/restart/version/status/report/switch-env

Options:

  -h, --help                                                   Prints this usage guide.
  -d, --debug                                                  Enabled debug mode.
  -p, --port string                                            Set the graphql port.
  --environment production/staging/development                 Set the working environment.
  --log-level ALL/TRACE/DEBUG/INFO/WARN/ERROR/FATAL/MARK/OFF   Set the log level.

  Copyright © 2024 Lime Technology, Inc.

```

## Key

To create and work with Unraid API keys, used for the local API, run the following command to view all available options. These options may change over time.

```sh
unraid-api key --help
```

## Report

To view the current status of the unraid-api and its connection to mothership, run:

```sh
unraid-api report
```

To view verbose data (anonymized), run:

```sh
unraid-api report -v
```

To view non-anonymized verbose data, run:

```sh
unraid-api report -vv
```

## Secrets

If you found this file you're likely a developer. If you'd like to know more about the API and when it's available please join [our discord](https://discord.unraid.net/).

## Internationalization

- Run `pnpm --filter @unraid/api i18n:extract` to scan the Nest.js source for translation helper usages and update `src/i18n/en.json` with any new keys. The extractor keeps existing translations intact and appends new keys with their English source text.

## Developer Documentation

For detailed information about specific features:

- [API Plugins](docs/developer/api-plugins.md) - Working with API plugins and workspace packages
- [Docker Feature](docs/developer/docker.md) - Container management, GraphQL API, and WebGUI integration
- [Feature Flags](docs/developer/feature-flags.md) - Conditionally enabling functionality
- [Repository Organization](docs/developer/repo-organization.md) - Codebase structure
- [Development Workflows](docs/developer/workflows.md) - Development processes
- [Temperature Monitoring](docs/developer/temperature.md) - Configuration and API details for temperature sensors

## License

Copyright Lime Technology Inc. All rights reserved.
