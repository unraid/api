# Development

## Installation

Manual install can be done with the following routes:
[production](https://stable.dl.unraid.net/unraid-api/dynamix.unraid.net.plg)
[staging](https://preview.dl.unraid.net/unraid-api/dynamix.unraid.net.staging.plg)

## Connecting to the API

### HTTP

This can be accessed by default via `http://tower.local/graphql`.

See <https://graphql.org/learn/serving-over-http/#http-methods-headers-and-body>

## Building in Docker

To get a development environment for testing start by running this docker command:

`npm run build:docker`
`npm run start:ddev`

which will give you an interactive shell inside of the newly build linux container.

To automatically build the plugin run the command below:

`npm run build:docker`

The builder command will build the plugin into deploy/release, and the interactive plugin lets you build the plugin or install node modules how you like.

## Logs

Logging can be configured via environment variables.

Log levels can be set when the api starts via `LOG_LEVEL=all/trace/debug/info/warn/error/fatal/mark/off`.

Additional detail for the log entry can be added with `LOG_CONTEXT=true` (warning, generates a lot of data).

By default, logs will be sent to syslog. Or you can set `LOG_TRANSPORT=file` to have logs saved in `/var/log/unraid-api/stdout.log`. Or enable debug mode to view logs inline.

Examples:

- `unraid-api start`
- `LOG_LEVEL=debug unraid-api start --debug`
- `LOG_LEVEL=trace LOG_CONTEXT=true LOG_TRANSPORT=file unraid-api start`

## Viewing data sent to mothership

If the environment variable `LOG_MOTHERSHIP_MESSAGES=true` exists, any data the unraid-api sends to mothership will be saved in clear text here: `/var/log/unraid-api/relay-messages.log`

Examples:

- `LOG_MOTHERSHIP_MESSAGES=true unraid-api start`
- `LOG_MOTHERSHIP_MESSAGES=true LOG_LEVEL=debug unraid-api start --debug`

## Debug Logging

To view debug logs, change the log level when starting the API. Then type unraid-api logs to trail the logs.
Examples:

- `LOG_LEVEL=debug unraid-api start`
- `unraid-api logs`

## Switching between staging and production environments

1. Stop the api: `unraid-api stop`
2. Switch environments: `unraid-api switch-env`
3. Start the api: `unraid-api start`
4. Confirm the environment: `unraid-api report`

## Playground

The playground can be access via `http://tower.local/graphql` while in debug mode.  
To get your API key open a terminal on your server and run `cat /boot/config/plugins/dynamix.my.servers/myservers.cfg | grep apikey=\"unraid | cut -d '"' -f2`. Add that API key in the "HTTP headers" panel of the playground.

```json
{
    "x-api-key": "__REPLACE_ME_WITH_API_KEY__"
}
```

Next add the query you want to run and hit the play icon.

```gql
query welcome {
    welcome {
        message
    }
}
```

You should get something like this back.

```json
{
    "data": {
        "welcome": {
            "message": "Welcome root to this Unraid 6.10.0 server"
        }
    }
}
```

Click the "Schema" and "Docs" button on the right side of the playground to learn more.

## Create a new release

To create a new version run `npm run release` and then run **ONLY** the `git push` section of the commands it returns.
To create a new prerelease run `npm run release -- --prerelease alpha`.

Pushing to this repo will cause an automatic "rolling" release to be built which can be accessed via the page for the associated Github action run.

## Using a custom version (e.g. testing a new release)

Find the Pull Request you'd like to install, and a link will be present as a comment to install a PR-specific version.
