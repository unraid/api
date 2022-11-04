import { CommaSeparatedString } from '@app/core/types/global';
import { IniStringBoolean } from '@app/core/types/ini';
import { Network } from '@app/core/types/states/network';
import { toBoolean } from '@app/core/utils/casting';

export type NetworkIni = Record<string, {
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
	description: string[];
	protocol: string[];
	useDhcp: IniStringBoolean[];
	ipaddr: string[];
	netmask: string[];
	gateway: string[];
	metric: string[];
	useDhcp6: IniStringBoolean[];
	ipaddr6: string[];
	netmask6: string[];
	gateway6: string[];
	metric6: string[];
	privacy6: string[];
	mtu: string[];
	type: string[];
}>;

export const parse = (iniFile: NetworkIni) => Object.values(iniFile).map(network => {
	const result: Network = {
		...network,
		dhcpKeepresolv: toBoolean(network.dhcpKeepresolv),
		dhcp6Keepresolv: toBoolean(network.dhcp6Keepresolv),
		bonding: toBoolean(network.bonding),
		bondnics: network.bondnics?.split(','),
		bridging: toBoolean(network.bridging),
		useDhcp: [toBoolean(network.useDhcp[0])],
		useDhcp6: [toBoolean(network.useDhcp6[0])],
	};

	return result;
});
