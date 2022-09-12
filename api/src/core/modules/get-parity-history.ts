/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { promises as fs } from 'fs';
import { CoreResult, CoreContext } from '@app/core/types';
import { FileMissingError } from '@app/core/errors/file-missing-error';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import Table from 'cli-table';
import { getters } from '@app/store';

/**
 * Get parity history.
 * @returns  All parity checks with their respective date, duration, speed, status and errors.
 */
export const getParityHistory = async (context: CoreContext): Promise<CoreResult> => {
	const { user } = context;

	// Bail if the user doesn't have permission
	ensurePermission(user, {
		resource: 'parity-history',
		action: 'read',
		possession: 'any',
	});

	const historyFilePath = getters.paths()['parity-checks'];
	const history = await fs.readFile(historyFilePath).catch(() => {
		throw new FileMissingError(historyFilePath);
	});

	// Convert checks into array of objects
	const lines = history.toString().trim().split('\n').reverse();
	const parityChecks = lines.map(line => {
		const [date, duration, speed, status, errors = '0'] = line.split('|');
		return {
			date,
			duration: Number.parseInt(duration, 10),
			speed,
			status,
			errors: Number.parseInt(errors, 10),
		};
	});

	// Create table for text output
	const table = new Table({
		head: ['Date', 'Duration', 'Speed', 'Status', 'Errors'],
	});
	// Update raw values with strings
	parityChecks.forEach(check => {
		const array = Object.values({
			...check,
			speed: check.speed ? check.speed : 'Unavailable',
			duration: check.duration >= 0 ? check.duration : 'Unavailable',
			status: check.status === '-4' ? 'Cancelled' : 'OK',
		});
		table.push(array);
	});

	return {
		text: table.toString(),
		json: parityChecks,
	};
};
