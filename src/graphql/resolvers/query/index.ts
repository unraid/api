/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */
import cloud from '@app/graphql/resolvers/query/cloud';
import config from '@app/graphql/resolvers/query/config';
import crashReportingEnabled from '@app/graphql/resolvers/query/crash-reporting-enabled';
import dashboard from '@app/graphql/resolvers/query/dashboard';
import disks from '@app/graphql/resolvers/query/disks';
import display from '@app/graphql/resolvers/query/display';
import flash from '@app/graphql/resolvers/query/flash';
import info from '@app/graphql/resolvers/query/info';
import online from '@app/graphql/resolvers/query/online';
import owner from '@app/graphql/resolvers/query/owner';
import registration from '@app/graphql/resolvers/query/registration';
import server from '@app/graphql/resolvers/query/server';
import servers from '@app/graphql/resolvers/query/servers';
import twoFactor from '@app/graphql/resolvers/query/two-factor';
import vms from '@app/graphql/resolvers/query/vms';

export const Query = {
	cloud,
	config,
	crashReportingEnabled,
	dashboard,
	disks,
	display,
	flash,
	info,
	online,
	owner,
	registration,
	server,
	servers,
	twoFactor,
	vms
};
