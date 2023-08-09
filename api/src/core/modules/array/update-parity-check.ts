import type { CoreContext, CoreResult } from '@app/core/types';
import { ensurePermission } from '@app/core/utils/permissions/ensure-permission';
import { emcmd } from '@app/core/utils/clients/emcmd';
import { FieldMissingError } from '@app/core/errors/field-missing-error';
import { ParamInvalidError } from '@app/core/errors/param-invalid-error';
import { getters } from '@app/store';

type State = 'start' | 'cancel' | 'resume' | 'cancel';

interface Context extends CoreContext {
	data: {
		state?: State;
		correct?: boolean;
	};
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
		possession: 'any',
	});

	// Validation
	if (!data.state) {
		throw new FieldMissingError('state');
	}

	const { state: wantedState } = data;
	const emhttp = getters.emhttp();
	const running = emhttp.var.mdResync !== 0;
	const states = {
		pause: {
			cmdNoCheck: 'Pause',
		},
		resume: {
			cmdCheck: 'Resume',
		},
		cancel: {
			cmdNoCheck: 'Cancel',
		},
		start: {
			cmdCheck: 'Check',
		},
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
		...(writeCorrectionsToParity ? { optionCorrect: 'correct' } : {}),
	});

	return {
		json: {},
	};
};
