import { valid } from 'semver';
/* eslint-disable new-cap */
import { String, Record, Array, type Static } from 'runtypes';
import { bytesAboveZero } from '@app/common/run-time/bytes-above-zero';
import { Service } from '@app/common/run-time/service';
import { Display } from '@app/common/run-time/display';
import { Config } from '@app/common/run-time/config';
import { TwoFactor } from '@app/common/run-time/two-factor';
import { Vars } from '@app/common/run-time/vars';
import { intAboveZero } from '@app/common/run-time/int-above-zero';

export const Dashboard = Record({
	apps: Record({
		installed: intAboveZero,
		started: intAboveZero,
	}),
	versions: Record({
		unraid: String.withConstraint(version => valid(version) !== null || `Invalid version tag: "${version}"`),
	}),
	os: Record({
		hostname: String,
		uptime: String,
	}),
	vms: Record({
		installed: intAboveZero,
		started: intAboveZero,
	}),
	array: Record({
		state: String,
		capacity: Record({
			bytes: Record({
				free: bytesAboveZero,
				used: bytesAboveZero,
				total: bytesAboveZero,
			}),
		}),
	}),
	services: Array(Service),
	display: Display,
	config: Config,
	vars: Vars,
	twoFactor: TwoFactor,
});

// eslint-disable-next-line @typescript-eslint/no-redeclare -- intentionally naming the variable the same as the type
export type Dashboard = Static<typeof Dashboard>;
