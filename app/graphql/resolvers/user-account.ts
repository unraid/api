/*!
 * Copyright 2019-2020 Lime Technology Inc.  All rights reserved.
 * Written by: Alexis Tyler
 */

export const UserAccount = {
    __resolveType(obj) {
        // Only a user has a password field, the current user aka "me" doesn't.
        if (obj.password) {
            return 'User';
        }

        return 'Me';
    }
};