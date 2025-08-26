/**
 * The actual string values used for auth actions in the API
 * These are the VALUES of the AuthAction enum from nest-authz, not the keys
 */
export type AuthActionValue = 
  | 'create:any' 
  | 'read:any' 
  | 'update:any' 
  | 'delete:any'
  | 'create:own'
  | 'read:own'
  | 'update:own'
  | 'delete:own';

/**
 * Common auth action values used in forms
 */
export const AUTH_ACTION_VALUES = {
  CREATE_ANY: 'create:any' as AuthActionValue,
  READ_ANY: 'read:any' as AuthActionValue,
  UPDATE_ANY: 'update:any' as AuthActionValue,
  DELETE_ANY: 'delete:any' as AuthActionValue,
  CREATE_OWN: 'create:own' as AuthActionValue,
  READ_OWN: 'read:own' as AuthActionValue,
  UPDATE_OWN: 'update:own' as AuthActionValue,
  DELETE_OWN: 'delete:own' as AuthActionValue,
} as const;
