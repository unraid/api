/**
 * @name OBJ_TO_STR
 * @param {object} obj
 * @returns {String}
 * @description Output key + value for each item in the object. Adds new line after each item.
 */
export const OBJ_TO_STR = obj => Object.entries(obj).reduce((str, [p, val]) => `${str}${p}: ${val}\n`, '');
