# @unraid/node-api

Graphql wrapper around [@unraid/core](https://github.com/unraid/core).

## Installation

Ensure you have the latest version of the unraid.net plugin.
This script should be run automatically on every boot.
```bash
/etc/rc.d/rc.unraid-api install
```

## Connecting

### HTTP
This can be accessed by default via `http://tower.local/graph`. If the server is connected to my servers then it's likely to have a DNS hash address, something like `https://www.__HASH_HERE__.unraid.net/graph`.

See https://graphql.org/learn/serving-over-http/#http-methods-headers-and-body

### WS
If you're using the ApolloClient please see https://github.com/apollographql/subscriptions-transport-ws#full-websocket-transport otherwise see https://github.com/apollographql/subscriptions-transport-ws/blob/master/PROTOCOL.md

## Logs

If installed on a unraid machine logs can be accessed via `/etc/rc.d/rc.unraid-api logs` or directly at `/var/run/graphql-api.log`; otherwise please see stdout.

Debug logs can be enabled via `/etc/rc.d/rc.unraid-api debug` or by sending a USR2 signal to the supervisor process.

## Playground

The playground can be enabled via `DEBUG=true /etc/rc.d/rc.unraid-api start`.
To get your api key open a terminal on your server and run `cat /boot/config/plugins/dynamix/dynamix.cfg | grep apikey= | cut -d '"' -f2`. Add that api key in the "HTTP headers" panel of the playground.

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
NCHAN=disable DEBUG=true LOG_LEVEL=info PATHS_STATES=$(pwd)/dev/states PATHS_DYNAMIX_CONFIG=$(pwd)/dev/dynamix.cfg PORT=5000 node index.js
```

## License
Copyright 2019 Lime Technology Inc. All rights reserved.
