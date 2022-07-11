import { Number } from 'runtypes';

/**
 * The max Int graphql can handle is 2^31 or 2,147,483,647
 *
 * See: https://slicknode.com/docs/data-modeling/scalar-types/#int
 */
const maxGraphqlNumber = 2_147_483_647;

export const intAboveZero = Number.withConstraint(value => {
	if (value > maxGraphqlNumber) return `${value} is too big`;
	if (value < 0) return `${value} is too small`;
	if (value % 1 !== 0) return `${value} is a float not an int`;
	return true;
});
