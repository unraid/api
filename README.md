# @unraid/api

## Installation

Install the production plugin via the apps tab (search for "my servers") on Unraid 6.9.2 or later.

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

  Copyright © 2021 Lime Technology, Inc.

```

## Report
To view the current status of the unraid-api and its connection to mothership, run:
```
unraid-api report
```

To view verbose data (anonymized), run:
```
unraid-api report -v
```

To view non-anonymized verbose data, run:
```
unraid-api report -vv
```

## Secrets
If you found this file you're likely a developer. If you'd like to know more about the API and when it's avaliable please join [our discord](https://discord.gg/unraid).

## Building on Arm / Windows platforms

In order to build on ARM or Windows you may need to use buildx in order to build the image (since libvirt will probably have issues on other architectures.) The docker-compose file specifies the architecture to use, so you can just build the containers with docker compose to get native linux versions

There are two different dev environments in the docker-compose file at the moment. One is for testing and based on node 18, and the other is for building the plugin and based on node 14.

To get a development environment for testing start by running this docker command: 

``docker-compose run interactive``

which will give you an interactive shell inside of the newly build linux container.

To get an environment for building the plugin run this docker command:

``docker-compose run builder`` or ``docker-compose run builder-interactive``

The builder command will build the plugin into deploy/release, and the interactive plugin lets you build the plugin or install node modules how you like. 

If you want to build the plugin, run ``docker-compose run builder`` to build the plugin (currently broken since Nexi doesn't have Node 18 binaries)

## License
Copyright 2019-2022 Lime Technology Inc. All rights reserved.
