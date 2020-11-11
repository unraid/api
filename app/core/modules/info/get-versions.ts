/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { getUnraidVersion, getSoftwareVersions } from '.';
import { CoreResult, CoreContext } from '../../types';

/**
 * Get all version info.
 */
export const getVersions = async function(context: CoreContext): Promise<CoreResult> {
	const unraidVersion = await getUnraidVersion(context).then(result => result.json);
	const softwareVersions = await getSoftwareVersions(context).then(result => result.json);

	const versions = {
		...unraidVersion,
		...softwareVersions
	};

	return {
		text: `Versions: ${JSON.stringify(versions, null, 2)}`,
		json: {
			...versions
		}
	};
};
