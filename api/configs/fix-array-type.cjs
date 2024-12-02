/**
 * This function wraps constant case, that turns any string into CONSTANT_CASE
 * However, this function has a bug that, if you pass _ to it it will return an empty
 * string. This small module fixes that
 *
 * @param {string*} str
 * @return {string}
 */
function FixArrayType(str) {
	if (str === 'Array') {
		return 'ArrayType';
	}

	// If result is an empty string, just return the original string
	return str;
}

module.exports = FixArrayType;

