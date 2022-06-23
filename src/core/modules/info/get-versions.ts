/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreResult, CoreContext } from '@app/core/types';
import { getSoftwareVersions } from '@app/core/modules/info/get-software-versions';
import { getUnraidVersion } from '@app/core/modules/info/get-unraid-version';

/**
 * Get all version info.
 */
export const getVersions = async function (context: CoreContext): Promise<CoreResult> {
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
