import { Serializer } from 'multi-ini';

const serializer = new Serializer({ keep_quotes: false });

const replacer = (_, value: any) => {
	if (typeof value === 'boolean') {
		return value ? 'true' : 'false';
	}

	return value;
};

/**
 *
 * @param object Any object to serialize
 * @returns String converted to ini with multi-ini, with any booleans string escaped to prevent a crash
 */
export const safelySerializeObjectToIni = (object: Record<string, any>): string => {
	const safeObject = JSON.parse(JSON.stringify(object, replacer));
	return serializer.serialize(safeObject);
};
