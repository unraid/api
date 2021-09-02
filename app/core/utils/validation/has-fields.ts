/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { LooseObject } from '../../types';

/**
* Check if object has fields.
* @param obj Object to check fields on
* @param fields Fields to check
*/
export const hasFields = (object: LooseObject, fields: string[]) => {
	const keys = Object.keys(object);
	return keys.length > 0 ? fields.filter(field => !keys.includes(field)) : fields;
};
