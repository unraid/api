/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'node:path';
import mm from 'micromongo';
import { paths } from '../paths';
import { LooseObject, IniStringBoolean, CommaSeparatedString } from '../types';
import { toBoolean } from '../utils/casting';
import { parseConfig } from '../utils/misc';
import { ArrayState } from './state';

type NetworkIni = Record<string, {
	dhcpKeepresolv: IniStringBoolean;
	dnsServer1: string;
	dnsServer2: string;
	dhcp6Keepresolv: IniStringBoolean;
	bonding: IniStringBoolean;
	bondname: string;
	bondnics: CommaSeparatedString;
	bondingMode: string;
	bondingMiimon: string;
	bridging: IniStringBoolean;
	brname: string;
	brnics: string;
	brstp: string;
	brfd: string;
	'description:0': string;
	'protocol:0': string;
	'useDhcp:0': IniStringBoolean;
	'ipaddr:0': string;
	'netmask:0': string;
	'gateway:0': string;
	'metric:0': string;
	'useDhcp6:0': IniStringBoolean;
	'ipaddr6:0': string;
	'netmask6:0': string;
	'gateway6:0': string;
	'metric6:0': string;
	'privacy6:0': string;
	mtu: string;
	type: string;
}>;

const parse = (state: NetworkIni) => {
	return Object.values(state).map(network => {
		const result = {
			...network,
			dhcpKeepresolv: toBoolean(network.dhcpKeepresolv),
			dhcp6Keepresolv: toBoolean(network.dhcp6Keepresolv),
			bonding: toBoolean(network.bonding),
			bondnics: network.bondnics.split(','),
			bridging: toBoolean(network.bridging),
			'useDhcp:0': toBoolean(network['useDhcp:0']),
			'useDhcp6:0': toBoolean(network['useDhcp6:0'])
		};

		return result;
	});
};

/**
 * Network
 */
class Network extends ArrayState {
	private static instance: Network;
	public channel = 'network';

	constructor() {
		super();

		if (Network.instance) {
			// eslint-disable-next-line no-constructor-return
			return Network.instance;
		}

		Network.instance = this;
	}

	get data() {
		if (this._data.length === 0) {
			const statesDirectory = paths.get('states')!;
			const statePath = path.join(statesDirectory, 'network.ini');
			const state = parseConfig<NetworkIni>({
				filePath: statePath,
				type: 'ini'
			});
			this._data = this.parse(state);
		}

		return this._data;
	}

	parse(state: any) {
		const data = parse(state);

		// Update local data
		this.set(data);

		// Update network channel with new networks
		this.emit('UPDATED', data);

		return data;
	}

	find(query?: LooseObject): Network[] {
		// eslint-disable-next-line unicorn/no-array-callback-reference
		return super.find(query);
	}

	findOne(query: LooseObject = {}): Network {
		return mm.findOne(this.data, query);
	}
}

export const networkState = new Network();
