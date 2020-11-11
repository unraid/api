/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

/**
* Remove duplicate objects from array.
* @param array An array of object to filter through.
* @param prop The property to base the duplication check on.
*/
export const removeDuplicatesFromArray = <T>(array: T[], prop: string): T[] => {
	return array.filter((object, pos, array_) => {
		return array_.map(mapObject => mapObject[prop].indexOf(object[prop]) === pos);
	});
};
