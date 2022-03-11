/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreResult, CoreContext, DynamixConfig } from '../../types';
import { paths } from '../../paths';
import { ensurePermission, toBoolean } from '../../utils';
import { loadState } from '../../utils/misc/load-state';

interface Result extends CoreResult {
	json: {
		scale: boolean;
		tabs: boolean;
		resize: boolean;
		wwn: boolean;
		total: boolean;
		usage: boolean;
		text: boolean;
		warning: number;
		critical: number;
		hot: number;
		max: number;
	};
}

/**
 * Get display info.
 */
export const getDisplay = async function (context: CoreContext): Promise<Result> {
	const { user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'display',
		action: 'read',
		possession: 'any'
	});

	const filePath = paths.get('dynamix-config')!;
	const { display } = loadState<DynamixConfig>(filePath)!;
	const result = {
		...display,
		scale: toBoolean(display.scale),
		tabs: toBoolean(display.tabs),
		resize: toBoolean(display.resize),
		wwn: toBoolean(display.wwn),
		total: toBoolean(display.total),
		usage: toBoolean(display.usage),
		text: toBoolean(display.text),
		warning: Number.parseInt(display.warning, 10),
		critical: Number.parseInt(display.critical, 10),
		hot: Number.parseInt(display.hot, 10),
		max: Number.parseInt(display.max, 10),
		locale: display.locale || 'en_US'
	};

	return {
		text: `Display: ${JSON.stringify(result, null, 2)}`,
		json: {
			...result
		}
	};
};
