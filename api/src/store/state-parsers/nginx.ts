import type { IniStringBooleanOrAuto } from '@app/core/types/ini.js';
import type { StateFileToIniParserMap } from '@app/store/types.js';
import { type FqdnEntry } from '@app/core/types/states/nginx.js';

// Allow upper or lowercase FQDN6, with optional separators
const fqdnRegex = /^nginx[_-]?(.+?)fqdn6?$/i;

export type NginxIni = {
    nginxCertname: string;
    nginxCertpath: string;
    nginxDefaulturl: string;
    nginxLanip: string;
    nginxLanip6: string;
    nginxLanmdns: string;
    nginxLanname: string;
    nginxPort: string;
    nginxPortssl: string;
    nginxUsessl: IniStringBooleanOrAuto;
    [nginxInterfaceFqdn: string]: string;
};

export const parse: StateFileToIniParserMap['nginx'] = (state) => {
    const fqdnKeys = Object.keys(state).filter((key) => fqdnRegex.test(key));

    const interfaceId = new Map<string, number>();
    const fqdnUrls: FqdnEntry[] = fqdnKeys.reduce<FqdnEntry[]>((acc, key) => {
        const match = fqdnRegex.exec(key);
        if (match && state[key]) {
            // We need to pull the number from the interface to get it by itself
            const interfaceType = match[1].replace(/[0-9]/g, '').toUpperCase();

            // Count the number of interfaces we've already added to the list
            const isIPv6 = key.endsWith('6');
            const currInterfaceId = interfaceId.get(interfaceType) || 0;
            interfaceId.set(interfaceType, currInterfaceId + 1);
            acc.push({
                interface: interfaceType,
                id: currInterfaceId,
                fqdn: state[key],
                isIpv6: isIPv6,
            });
        }
        return acc;
    }, []);

    fqdnUrls.forEach((fqdn) => {
        if ((interfaceId.get(fqdn.interface) || 0) <= 1) {
            fqdn.id = null;
        }
    });

    return {
        certificateName: state.nginxCertname,
        certificatePath: state.nginxCertpath,
        defaultUrl: state.nginxDefaulturl,
        httpPort: Number(state.nginxPort),
        httpsPort: Number(state.nginxPortssl),
        lanIp: state.nginxLanip,
        lanIp6: state.nginxLanip6,
        lanMdns: state.nginxLanmdns,
        lanName: state.nginxLanname,
        sslEnabled: state.nginxUsessl !== 'no',
        sslMode: state.nginxUsessl,
        wanAccessEnabled: state.nginxWanaccess === 'yes',
        wanIp: state.nginxWanip,
        fqdnUrls: fqdnUrls as FqdnEntry[],
    };
};
