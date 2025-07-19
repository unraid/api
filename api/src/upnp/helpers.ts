import { Client } from '@runonflux/nat-upnp';

import { THIRTY_SECONDS_MS } from '@app/consts.js';
import { IS_DOCKER } from '@app/environment.js';
import { MockUpnpClient } from '@app/upnp/mock-upnp-client.js';

// If we're in docker mode, load the mock client
export const upnpClient = IS_DOCKER
    ? new MockUpnpClient({ timeout: THIRTY_SECONDS_MS })
    : new Client({
          timeout: THIRTY_SECONDS_MS,
      });
