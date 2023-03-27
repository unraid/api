import { type DelayFunctionOptions } from '@apollo/client/link/retry/delayFunction';

export function buildDelayFunction(
	delayOptions?: DelayFunctionOptions,
): (count: number) => number {
	const { initial = 10_000, jitter = true, max = Infinity } = delayOptions ?? {};
	// If we're jittering, baseDelay is half of the maximum delay for that
	// attempt (and is, on average, the delay we will encounter).
	// If we're not jittering, adjust baseDelay so that the first attempt
	// lines up with initialDelay, for everyone's sanity.
	const baseDelay = jitter ? initial : initial / 2;

	return (count: number) => {
		// eslint-disable-next-line no-mixed-operators
		let delay = Math.min(max, baseDelay * 2 ** count);
		if (jitter) {
			// We opt for a full jitter approach for a mostly uniform distribution,
			// but bound it within initialDelay and delay for everyone's sanity.
			// eslint-disable-next-line operator-assignment
			delay = Math.random() * delay;
		}

		return delay;
	};
}
