/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

/**
 * Sanitize vm vendor name.
 * @param vendorName The vendor name to sanitize.
 * @returns The sanitized vendor name.
 */
export const sanitizeVendor = (vendorName: string): string => {
	if (vendorName === '') {
		return '';
	}

	let vendor: string = vendorName;

	// Specialized vendor name cleanup
	// e.g.: Advanced Micro Devices, Inc. [AMD/ATI] --> Advanced Micro Devices, Inc.
	const regex = new RegExp(/(?<gpuvendor>.+) \[.+]/);
	const match = regex.exec(vendor);
	if (match?.groups?.gpuvendor) {
		vendor = match.groups.gpuvendor;
	}

	// Remove un-needed text
	const junk = [' Corporation', ' Semiconductor ', ' Technology Group Ltd.', ' System, Inc.', ' Systems, Inc.', ' Co., Ltd.', ', Ltd.', ', Ltd', ', Inc.'];
	junk.forEach(item => {
		vendor = vendor.replace(item, '');
	});

	vendor = vendor.replace('Advanced Micro Devices', 'AMD');
	vendor = vendor.replace('Samsung Electronics Co.', 'Samsung');

	return vendor;
};
