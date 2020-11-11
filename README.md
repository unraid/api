# @unraid/node-api

Unraid API

## Installation

Ensure you have the latest version of the unraid.net plugin.
This script should be run automatically on every boot.
```bash
/etc/rc.d/rc.unraid-api install
```

## Connecting

### HTTP
This can be accessed by default via `http://tower.local/graphql`. If the server is connected to my servers then it's likely to have a DNS hash address, something like `https://www.__HASH_HERE__.unraid.net/graphql`.

See https://graphql.org/learn/serving-over-http/#http-methods-headers-and-body

### WS
If you're using the ApolloClient please see https://github.com/apollographql/subscriptions-transport-ws#full-websocket-transport otherwise see https://github.com/apollographql/subscriptions-transport-ws/blob/master/PROTOCOL.md

## Logs

If installed on a unraid machine logs can be accessed via syslog.

Debug logs can be enabled via stdout while running with `start-debug`.

## Playground

The playground can be access via `http://tower.local/graphql` while `PLAYGROUND=true` and `INTROSPECTION=true`. These values can be set in the `ecosystem.config.js` file in `/usr/local/bin/node/node-api`.
To get your API key open a terminal on your server and run `cat /boot/config/plugins/dynamix/dynamix.cfg | grep apikey= | cut -d '"' -f2`. Add that api key in the "HTTP headers" panel of the playground.

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
      "message": "Welcome root to this Unraid 6.8.0 server"
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
  DEBUG=true \ # Enable debug logging
  PATHS_UNRAID_DATA=$(pwd)/dev/data \ # Where we store plugin data (e.g. permissions.json)
  PATHS_STATES=$(pwd)/dev/states \ # Where .ini files live (e.g. vars.ini)
  PATHS_DYNAMIX_BASE=$(pwd)/dev/dynamix \ # Dynamix's data directory
  PATHS_DYNAMIX_CONFIG=$(pwd)/dev/dynamix/dynamix.cfg \ # Dynamix's config file
  PORT=8500 \ # What port node-api should start on (e.g. /var/run/node-api.sock or 8000)
  node index.js
```

## License
Copyright 2019 Lime Technology Inc. All rights reserved.
