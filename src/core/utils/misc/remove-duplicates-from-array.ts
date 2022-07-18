/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

/**
* Remove duplicate objects from array.
* @param array An array of object to filter through.
* @param prop The property to base the duplication check on.
*/
export const removeDuplicatesFromArray = <T>(array: T[], prop: string): T[] => array.filter((object, pos, array_) => array_.map(mapObject => mapObject[prop].indexOf(object[prop]) === pos));
