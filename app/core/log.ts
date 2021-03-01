/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { Logger } from 'logger';

export const log = new Logger({ prefix: '@unraid' });
export const coreLogger = log.createChild({ prefix: 'core' });
export const graphqlLogger = log.createChild({ prefix: 'graphql' });
export const relayLogger = log.createChild({ prefix: 'relay' });
export const discoveryLogger = log.createChild({ prefix: 'discovery' });
export const apiManagerLogger = log.createChild({ prefix: 'api-manager' });
