# @unraid/api

## Installation

Ensure you have the latest version of the unraid.net plugin.
This script should be run automatically on every boot.
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

Options:

  -h, --help                                      Prints this usage guide.                
  -d, --debug                                     Enabled debug mode.                     
  -p, --port string                               Set the graphql port.                   
  --environment production/staging/development    Set the working environment.            
  --log-level error/warn/info/debug/trace/silly   Set the log level.                      
  -v, --version                                   Show version.                           

  Copyright © 2021 Lime Technology, Inc. 

```

## Connecting

### HTTP
This can be accessed by default via `http://tower.local/graphql`. If the server is connected to my servers then it's likely to have a DNS hash address, something like `https://www.__HASH_HERE__.unraid.net/graphql`.

See https://graphql.org/learn/serving-over-http/#http-methods-headers-and-body

### WS
If you're using the ApolloClient please see https://github.com/apollographql/subscriptions-transport-ws#full-websocket-transport otherwise see https://github.com/apollographql/subscriptions-transport-ws/blob/master/PROTOCOL.md

## Logs

If installed on a unraid machine logs can be accessed via syslog.

Log levels can be changed on start using the `--log-level` flag like so `--log-level=info/debug/silly/trace`.

## Debug mode

Debug mode can be enabled with the `-d` or `--debug` flag.
This will enable debug logs and the playground.


## Playground

The playground can be access via `http://tower.local/graphql` while in debug mode.  
To get your API key open a terminal on your server and run `cat /boot/config/plugins/dynamix.my.servers/myservers.cfg | grep apikey= | cut -d '"' -f2`. Add that API key in the "HTTP headers" panel of the playground.

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
For exploring the schema visually I'd suggest using [Voyager](https://apis.guru/graphql-voyager/).

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

To create a new version run `npm run release`.
To create a new prerelease run `npm run release -- --prerelease alpha`.

## Using a custom version (e.g. testing a new release)
1. Download the tgz you want from [the releases page](https://github.com/unraid/api/releases) and copy to `/boot/config/plugins/dynamix.my.servers/unraid-api.tgz`.
2. Download the plugin `https://s3.amazonaws.com/dnld.lime-technology.com/unraid-api/dynamix.unraid.net.staging.plg` to a new area on the flash drive. I put it in `/boot/config/custom/`.
3. Edit that plg and remove the MD5/SHA256 entries from `unraid-api.tgz`. Now when it installs it will use the `unraid-api.tgz` that exists on the flash instead of downloading the latest one.
4. Go to Plugins -> Install Plugin -> navigate to /boot/config/custom and select the staging plugin.


## License
Copyright 2019-2021 Lime Technology Inc. All rights reserved.
