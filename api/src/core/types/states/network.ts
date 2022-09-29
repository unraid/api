/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

export type Network = {
	dhcpKeepresolv: boolean;
	dnsServer1: string;
	dnsServer2: string;
	dhcp6Keepresolv: boolean;
	bonding: boolean;
	bondname: string;
	bondnics: string[];
	bondingMode: string;
	bondingMiimon: string;
	bridging: boolean;
	brname: string;
	brnics: string;
	brstp: string;
	brfd: string;
	'description': string[];
	'protocol': string[];
	'useDhcp': boolean[];
	'ipaddr': string[];
	'netmask': string[];
	'gateway': string[];
	'metric': string[];
	'useDhcp6': boolean[];
	'ipaddr6': string[];
	'netmask6': string[];
	'gateway6': string[];
	'metric6': string[];
	'privacy6': string[];
	mtu: string[];
	type: string[];
};

export type Networks = Network[];
