/**
 * Sanitize vm product name.
 * @param productName The product name to sanitize.
 * @returns The sanitized product name.
 */
export const sanitizeProduct = (productName: string): string => {
	if (productName === '') {
		return '';
	}

	let product = productName;

	product = product.replace(' PCI Express', ' PCIe');
	product = product.replace(' High Definition ', ' HD ');

	return product;
};
