/** Output key + value as string for each item in the object. Adds new line after each item. */
export const OBJ_TO_STR = (obj: object): string => Object.entries(obj).reduce((str, [p, val]) => `${str}${p}: ${val}\n`, '');
