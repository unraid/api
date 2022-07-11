/*!
 * Copyright 2019-2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

/* eslint-disable new-cap */
import { Boolean, Static, Array, Partial, Null, ValidationError } from 'runtypes';
import { logger } from '@app/common/log';
import { Info } from '@app/common/run-time/info';
import { Service } from '@app/common/run-time/service';
import { Dashboard } from '@app/common/run-time/dashboard';
import { ServerArray } from '@app/common/run-time/server-array';
import { TwoFactor } from '@app/common/run-time/two-factor';
import { Display } from '@app/common/run-time/display';
import { Vars } from '@app/common/run-time/vars';
import { Domain } from '@app/common/run-time/domain';
import { Me } from '@app/common/run-time/me';
import { Config } from '@app/common/run-time/config';
import { Vms } from '@app/common/run-time/vms';
import { validateRunType } from '@app/common/validate-run-type';

export const Server = Partial({
	online: Boolean.Or(Null),
	info: Info.Or(Null),
	array: ServerArray.Or(Null),
	services: Array(Service).Or(Null),
	pluginModule: Partial({}).Or(Null),
	display: Display.Or(Null),
	me: Me.Or(Null),
	domains: Array(Domain).Or(Null),
	vms: Vms.Or(Null),
	vars: Vars.Or(Null),
	config: Config.Or(Null),
	twoFactor: TwoFactor.Or(Null),
	dashboard: Dashboard.Or(Null)
});

export type Server = Static<typeof Server>;

export const validateServer = ({
	data,
	apiVersion,
	flashGuid
}: {
	data: Server;
	apiVersion: string;
	flashGuid: string;
}): Server | undefined => {
	try {
		// Check arguments
		if (!apiVersion) throw new Error('apiVersion is empty');
		if (!flashGuid) throw new Error('flashGuid is empty');

		// Fix known issues with the most up to date client
		if (apiVersion === 'v2.47.1') {
			// Fix capacity being NaN
			['free', 'total', 'used'].forEach(field => {
				if (data.dashboard && [NaN, 'NaN'].includes(data.dashboard?.array.capacity.bytes[field])) {
					data.dashboard.array.capacity.bytes[field] = 0;
				}
			});
		}

		// Check the dashboard field first
		if (data.dashboard) validateRunType(Dashboard, data.dashboard);

		// Check server object
		const server = validateRunType(Server, data);
		if (!server) return undefined;

		// This ensures we don't end up with extra keys
		const { online, info, array, services, display, me, domains, vms, vars, config, twoFactor, dashboard } = server;
		const cleanServer = Object.fromEntries(Object.entries({ online, info, array, services, display, me, domains, vms, vars, config, twoFactor, dashboard }).filter(([_, value]) => value !== undefined));
		return Object.keys(cleanServer).length === 0 ? undefined : cleanServer;
	} catch (error: unknown) {
		logger.addContext('apiVersion', apiVersion);
		logger.addContext('flashGuid', flashGuid);
		logger.error('Failed validating server object for %s with "%s"', flashGuid, ((error as ValidationError).details ? JSON.stringify((error as ValidationError).details) : undefined) ?? (error as Error).message);
		logger.removeContext('apiVersion');
		logger.removeContext('flashGuid');
		return undefined;
	}
};
