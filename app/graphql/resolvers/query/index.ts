/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */
import cloud from './cloud';
import config from './config';
import crashReportingEnabled from './crash-reporting-enabled';
import disks from './disks';
import display from './display';
import flash from './flash';
import info from './info';
import online from './online';
import owner from './owner';
import registration from './registration';
import server from './server';
import servers from './servers';
import twoFactor from './two-factor';
import vms from './vms';

export const Query = {
	config,
	crashReportingEnabled,
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
