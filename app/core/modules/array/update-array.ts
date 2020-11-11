/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../../types';
import { hasFields, ensurePermission, emcmd, arrayIsRunning, uppercaseFirstChar } from '../../utils';
import { AppError, FieldMissingError, ParamInvalidError } from '../../errors';
import { getArray } from '..';

// @TODO: Fix this not working across node apps
//        each app has it's own lock since the var is scoped
//        ideally this should have a timeout to prevent it sticking
let locked = false;

export const updateArray = async(context: CoreContext): Promise<CoreResult> => {
	const { data = {}, user } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'array',
		action: 'update',
		possession: 'any'
	});

	const missingFields = hasFields(data, ['state']);

	if (missingFields.length !== 0) {
		// Only log first error
		throw new FieldMissingError(missingFields[0]);
	}

	const { state: nextState } = data;
	const startState = arrayIsRunning() ? 'started' : 'stopped';
	const pendingState = nextState === 'stop' ? 'stopping' : 'starting';

	if (!['start', 'stop'].includes(nextState)) {
		throw new ParamInvalidError('state', nextState);
	}

	// Prevent this running multiple times at once
	if (locked) {
		throw new AppError('Array state is still being updated.');
	}

	// Prevent starting/stopping array when it's already in the same state
	if ((arrayIsRunning && nextState === 'start') || (!arrayIsRunning && nextState === 'stop')) {
		throw new AppError(`The array is already ${startState}`);
	}

	// Set lock then start/stop array
	locked = true;
	const command = {
		[`cmd${uppercaseFirstChar(nextState)}`]: uppercaseFirstChar(nextState),
		startState: startState.toUpperCase()
	};

	// `await` has to be used otherwise the catch
	// will finish after the return statement below
	await emcmd(command).finally(() => {
		locked = false;
	});

	// Get new array JSON
	const array = getArray(context);

	/**
     * Update array details
     *
     * @memberof Core
     * @module array/update-array
     * @param {Core~Context} context Context object.
     * @param {Object} context.data The data object.
     * @param {'start'|'stop'} context.data.state If the array should be started or stopped.
     * @param {State~User} context.user The current user.
     * @returns {Core~Result} The updated array.
     */
	return {
		text: `Array was ${startState}, ${pendingState}.`,
		json: {
			...array.json,
			state: nextState === 'start' ? 'started' : 'stopped',
			previousState: startState,
			pendingState
		}
	};
};
