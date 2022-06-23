/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { PubSub } from 'apollo-server';
import EventEmitter from 'events';

// Allow subscriptions to have 30 connections
const eventEmitter = new EventEmitter();
eventEmitter.setMaxListeners(30);

export const pubsub = new PubSub({ eventEmitter });
