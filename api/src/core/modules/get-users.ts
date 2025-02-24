import type { CoreContext, CoreResult } from '@app/core/types/index.js';
import { AppError } from '@app/core/errors/app-error.js';
import { type User } from '@app/core/types/states/user.js';
import { getters } from '@app/store/index.js';

interface Context extends CoreContext {
    query: {
        /** Should all fields be returned? */
        slim: string;
    };
}

/**
 * Get all users.
 */
export const getUsers = async (context: Context): Promise<CoreResult> => {
    const { query } = context;

    // Default to only showing limited fields
    const { slim = 'true' } = query;
    const { users } = getters.emhttp();

    if (users.length === 0) {
        // This is likely a new install or something went horribly wrong
        throw new AppError('No users found.', 404);
    }

    const result =
        slim === 'true'
            ? users.map((user: User) => {
                  const { id, name, description, role } = user;
                  return {
                      id,
                      name,
                      description,
                      role,
                  };
              })
            : users;

    return {
        text: `Users: ${JSON.stringify(result, null, 2)}`,
        json: result,
    };
};
