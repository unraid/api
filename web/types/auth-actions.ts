/**
 * The actual string values used for auth actions in the API
 * These are the VALUES of the AuthAction enum, matching the keys
 */
export type AuthActionValue = 
  | 'CREATE_ANY' 
  | 'READ_ANY' 
  | 'UPDATE_ANY' 
  | 'DELETE_ANY'
  | 'CREATE_OWN'
  | 'READ_OWN'
  | 'UPDATE_OWN'
  | 'DELETE_OWN';

/**
 * Common auth action values used in forms
 */
export const AUTH_ACTION_VALUES = {
  CREATE_ANY: 'CREATE_ANY' as AuthActionValue,
  READ_ANY: 'READ_ANY' as AuthActionValue,
  UPDATE_ANY: 'UPDATE_ANY' as AuthActionValue,
  DELETE_ANY: 'DELETE_ANY' as AuthActionValue,
  CREATE_OWN: 'CREATE_OWN' as AuthActionValue,
  READ_OWN: 'READ_OWN' as AuthActionValue,
  UPDATE_OWN: 'UPDATE_OWN' as AuthActionValue,
  DELETE_OWN: 'DELETE_OWN' as AuthActionValue,
} as const;

/**
 * Convert legacy auth action format (like 'create:any') to new format
 * This handles backward compatibility during transition
 */
export function authActionValueToEnum(value: AuthActionValue | string): string {
  // If already in new format, return as-is
  if (value.includes('_')) {
    return value;
  }
  // Convert 'create:any' to 'CREATE_ANY' for legacy format
  return value.toUpperCase().replace(':', '_');
}

/**
 * Convert AuthAction enum to legacy format if needed
 * This is for backward compatibility with old clients
 */
export function authActionEnumToValue(enumValue: string): AuthActionValue {
  // Already in new format, return as-is
  return enumValue as AuthActionValue;
}
