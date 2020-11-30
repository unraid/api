/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { Logger } from 'logger';

export const log = new Logger();
export const coreLogger = log.createChild({ prefix: '[@unraid/core]: '});
export const mothershipLogger = log.createChild({ prefix: '[@unraid/mothership]: '});
export const graphqlLogger = log.createChild({ prefix: '[@unraid/graphql]: '});
export const discoveryLogger = log.createChild({ prefix: '[@unraid/discovery]: '});