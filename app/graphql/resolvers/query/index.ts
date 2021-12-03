/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */
import crashReportingEnabled from './crash-reporting-enabled';
import config from './config';
import display from './display';
import disks from './disks';
import flash from './flash';
import info from './info';
import online from './online';
import owner from './owner';
import registration from './registration';
import server from './server';
import servers from './servers';
import vms from './vms';
import twoFactor from './two-factor';

export const Query = {
	crashReportingEnabled,
	config,
	disks,
	display,
	flash,
	info,
	online,
	owner,
	registration,
	vms,
	server,
	servers,
	twoFactor
};
