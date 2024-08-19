import type { IniStringBooleanOrAuto } from '@app/core/types/ini';
import { FqdnEntry } from '@app/core/types/states/nginx';
import type { StateFileToIniParserMap } from '@app/store/types';

// Allow upper or lowercase FQDN6
const fqdnRegex = /^nginx(.*?)fqdn6?$/i;

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
    nginxWanip: string;
    nginxWanaccess: string;
    [nginxInterfaceFqdn: string]: string;
};

export const parse: StateFileToIniParserMap['nginx'] = (state) => {
    const fqdnKeys = Object.keys(state).filter((key) => fqdnRegex.test(key));
    const fqdnUrls: FqdnEntry[] = fqdnKeys.reduce<FqdnEntry[]>((acc, key) => {
        const match = fqdnRegex.exec(key);
        if (match) {
            // We need to pull the number from the interface to get it by itself
            const interfaceType = match[1].replace(/[0-9]/g, '').toUpperCase();
            const id = Number(match[1].replace(/\D/g, ''));
            const isIPv6 = key.endsWith('6');
            acc.push({
                interface: interfaceType,
                id: id ?? null,
                fqdn: state[key],
                isIpv6: isIPv6,
            });
        }
        return acc;
    }, []);

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
