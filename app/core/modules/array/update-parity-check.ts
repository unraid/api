/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import { CoreContext, CoreResult } from '../../types';
import { FieldMissingError, ParamInvalidError } from '../../errors';
import { emcmd, ensurePermission } from '../../utils';
import { varState } from '../../states';

type State = 'start' | 'cancel' | 'resume' | 'cancel';

interface Context extends CoreContext {
	data: {
		state?: State
		correct?: boolean
	}
}

/**
 * Remove a disk from the array.
 * @returns The update array.
 */
export const updateParityCheck = async (context: Context): Promise<CoreResult> => {
	const { user, data } = context;

	// Check permissions
	ensurePermission(user, {
		resource: 'array',
		action: 'update',
		possession: 'any'
	});

	// Validation
	if (!data.state) {
		throw new FieldMissingError('state');
	}

	const { state: wantedState } = data;
	const running = varState?.data?.mdResync !== 0;
	const states = {
		pause: {
			cmdNoCheck: 'Pause'
		},
		resume: {
			cmdCheck: 'Resume'
		},
		cancel: {
			cmdNoCheck: 'Cancel'
		},
		start: {
			cmdCheck: 'Check'
		}
	};

	let allowedStates = Object.keys(states);

	// Only allow starting a check if there isn't already one running
	if (running) {
		allowedStates = allowedStates.splice(allowedStates.indexOf('start'), 1);
	}

	// Only allow states from states object
	if (!allowedStates.includes(wantedState)) {
		throw new ParamInvalidError('state', wantedState);
	}

	// Should we write correction to the parity during the check
	const writeCorrectionsToParity = wantedState === 'start' && data.correct;

	await emcmd({
		startState: 'STARTED',
		...states[wantedState],
		...(writeCorrectionsToParity ? { optionCorrect: 'correct' } : {})
	});

	return {
		json: {}
	};
};
