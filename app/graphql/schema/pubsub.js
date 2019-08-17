/*
 * Copyright 2019 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

module.exports = function ($injector) {
    const { PubSub } = $injector.resolve('apollo-server');
    const pubsub = new PubSub();

    return pubsub;
};