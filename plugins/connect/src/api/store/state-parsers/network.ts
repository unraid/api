import type { StateFileToIniParserMap } from '@app/store/types.js';
import { type CommaSeparatedString } from '@app/core/types/global.js';
import { type IniStringBoolean } from '@app/core/types/ini.js';
import { type Network } from '@app/core/types/states/network.js';
import { toBoolean } from '@app/core/utils/casting.js';

export type NetworkIni = Record<
    string,
    {
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
    }
>;

export const parse: StateFileToIniParserMap['network'] = (iniFile) =>
    Object.values(iniFile).map((network) => {
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
