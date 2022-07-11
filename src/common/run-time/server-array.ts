/* eslint-disable new-cap */
import { String, Partial } from 'runtypes';
import { bytesAboveZero } from '@app/common/run-time/bytes-above-zero';

export const ServerArray = Partial({
	state: String,
	capacity: Partial({
		bytes: Partial({
			free: bytesAboveZero,
			used: bytesAboveZero,
			total: bytesAboveZero
		})
	})
});
