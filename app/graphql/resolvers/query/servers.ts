/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { utils } from '../../../core';
import type { Context } from '../../schema/utils';
import { getServers } from '../../schema/utils';

const { ensurePermission } = utils;

export default (_: unknown, __: unknown, context: Context) => {
    ensurePermission(context.user, {
        resource: 'servers',
        action: 'read',
        possession: 'any'
    });
    
    // All servers
    return getServers().catch(() => []);
};
