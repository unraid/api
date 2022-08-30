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

  Copyright © 2022 Lime Technology, Inc.

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
If you found this file you're likely a developer. If you'd like to know more about the API and when it's available please join [our discord](https://discord.gg/unraid).

## License
Copyright 2019-2022 Lime Technology Inc. All rights reserved.
