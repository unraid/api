# @unraid/api

## Installation

Install the [production](https://s3.amazonaws.com/dnld.lime-technology.com/unraid-api/dynamix.unraid.net.plg) or [staging](https://s3.amazonaws.com/dnld.lime-technology.com/unraid-api/dynamix.unraid.net.staging.plg) plugin on Unraid 6.9.0-rc1 or later (6.9.2 or higher recommended).

This script will be run automatically on every boot.
```bash
/etc/rc.d/rc.unraid-api install
```

## CLI

If you're on a unraid v6.9.0 or later machine this should be available by running `unraid-api` in any directory.

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

  Copyright © 2021 Lime Technology, Inc.

```

## Connecting

### HTTP
This can be accessed by default via `http://tower.local/graphql`.

See https://graphql.org/learn/serving-over-http/#http-methods-headers-and-body

### WS
If you're using the ApolloClient please see https://github.com/apollographql/subscriptions-transport-ws#full-websocket-transport otherwise see https://github.com/apollographql/subscriptions-transport-ws/blob/master/PROTOCOL.md

## Logs

Logging can be configured via environment variables.

Log levels can be set when the api starts via `LOG_LEVEL=all/trace/debug/info/warn/error/fatal/mark/off`.

Additional detail for the log entry can be added with `LOG_CONTEXT=true` (warning, generates a lot of data).

By default, logs will be sent to syslog.  Or you can set `LOG_TRANSPORT=file` to have logs saved in `/var/log/unraid-api/stdout.log`. Or enable debug mode to view logs inline.

Examples:

* `unraid-api start`
* `LOG_LEVEL=debug unraid-api start --debug`
* `LOG_LEVEL=trace LOG_CONTEXT=true LOG_TRANSPORT=file unraid-api start`

Log levels can be increased without restarting the api by issuing this command:
```
kill -s SIGUSR2 `pidof unraid-api`
```
and decreased via:
```
kill -s SIGUSR1 `pidof unraid-api`
```

## Viewing data sent to mothership

If the environment variable `LOG_MOTHERSHIP_MESSAGES=true` exists, any data the unraid-api sends to mothership will be saved in clear text here: `/var/log/unraid-api/relay-messages.log`

Examples:
* `LOG_MOTHERSHIP_MESSAGES=true unraid-api start`
* `LOG_MOTHERSHIP_MESSAGES=true LOG_LEVEL=debug unraid-api start --debug`

## Debug mode

Debug mode can be enabled with the `-d` or `--debug` flag.
This will enable the graphql playground and prevent the application starting as a daemon. Logs will be shown inline rather than saved to a file.

Examples:
* `unraid-api start --debug`
* `LOG_LEVEL=debug unraid-api start --debug`

## Report
To view the current status of the unraid-api and its connection to mothership, run:
```
unraid-api report
```

To view verbose data (anonymized), run:
```
unraid-api report -v
```

To view non-anomyzed verbose data, run:
```
unraid-api report -vv
```


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
  "x-api-key":"__REPLACE_ME_WITH_API_KEY__"
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

For exploring the schema visually I'd suggest using [Voyager](https://apis.guru/graphql-voyager/) (click Change Schema -> Introspection, then copy/paste the introspection query into the local Graph Playground, and copy/paste the results back into Voyager).

# Development

## Running this locally
```bash
NCHAN=disable \ # Disable nchan polling
  MOTHERSHIP_RELAY_WS_LINK=ws://localhost:8000 \ # Switch to local copy of mothership
  PATHS_UNRAID_DATA=$(pwd)/dev/data \ # Where we store plugin data (e.g. permissions.json)
  PATHS_STATES=$(pwd)/dev/states \ # Where .ini files live (e.g. vars.ini)
  PATHS_DYNAMIX_BASE=$(pwd)/dev/dynamix \ # Dynamix's data directory
  PATHS_DYNAMIX_CONFIG=$(pwd)/dev/dynamix/dynamix.cfg \ # Dynamix's config file
  PATHS_MY_SERVERS_CONFIG=$(pwd)/dev/unraid.net/myservers.cfg \ # My servers config file
  PORT=8500 \ # What port unraid-api should start on (e.g. /var/run/unraid-api.sock or 8000)
  node dist/cli.js --debug # Enable debug logging
```

## Release

To create a new version run `npm run release` and then run **ONLY** the `git push` section of the commands it returns.
To create a new prerelease run `npm run release -- --prerelease alpha`.

Pushing to this repo will cause an automatic "rolling" release to be built which can be accessed via the page for the associated Github action run.

## Using a custom version (e.g. testing a new release)
1. Install the [production](https://s3.amazonaws.com/dnld.lime-technology.com/unraid-api/dynamix.unraid.net.plg) or [staging](https://s3.amazonaws.com/dnld.lime-technology.com/unraid-api/dynamix.unraid.net.staging.plg) plugin 
2. Download the tgz you want from [the releases page](https://github.com/unraid/api/releases) and copy to `/boot/config/plugins/dynamix.my.servers/unraid-api.tgz`.
3. Stop the api if it is running: `unraid-api stop`
4. Install the new api: `/etc/rc.d/rc.unraid _install`
5. Start the api: `unraid-api start`
6. Confirm the version: `unraid-api report`


## License
Copyright 2019-2022 Lime Technology Inc. All rights reserved.
