# @unraid/graphql-api

Graphql-api wrapper around [@unraid/core](https://github.com/unraid/core).

## Installation

Ensure you have the latest version of the unraid.net plugin.
This script should be run automatically on every boot.
```bash
/etc/rc.d/rc.unraid.net install
```

## Connecting

### HTTP
This can be accessed by default via `http://tower.local/graph`. If the server is connected to my servers then it's likely to have a DNS hash address, something like `https://www.__HASH_HERE__.unraid.net/graph`.

See https://graphql.org/learn/serving-over-http/#http-methods-headers-and-body

### WS
If you're using the ApolloClient please see https://github.com/apollographql/subscriptions-transport-ws#full-websocket-transport otherwise see https://github.com/apollographql/subscriptions-transport-ws/blob/master/PROTOCOL.md

## License
Copyright 2019 Lime Technology Inc. All rights reserved.
