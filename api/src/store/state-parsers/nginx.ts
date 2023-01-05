import type { IniStringBooleanOrAuto } from '@app/core/types/ini';
import type { StateFileToIniParserMap } from '@app/store/types';
import { type WireguardFqdn } from '../../core/types/states/nginx';

const nginxWgFqdnRegex = /nginxWg([0-9]+)Fqdn/;

export type NginxIni = {
	nginxCertname: string;
	nginxCertpath: string;
	nginxDefaulturl: string;
	nginxLanfqdn: string;
	nginxLanfqdn6: string;
	nginxLanip: string;
	nginxLanip6: string;
	nginxLanmdns: string;
	nginxLanname: string;
	nginxPort: string;
	nginxPortssl: string;
	nginxUsessl: IniStringBooleanOrAuto;
	nginxWanfqdn: string;
	nginxWanfqdn6: string;
	nginxWanip: string;
	nginxWanaccess: string;
	[nginxWgXFqdn: string]: string;
};

export const parse: StateFileToIniParserMap['nginx'] = state => {
	const wireguardKeys = Object.keys(state).filter(key => nginxWgFqdnRegex.exec(key));

	const wireguardUrls: WireguardFqdn[] = wireguardKeys.map(key => ({
		id: Number(nginxWgFqdnRegex.exec(key)?.[1] ?? -1),
		fqdn: state[key],
	})).filter(fqdn => fqdn.id > -1);

	return {
		certificateName: state.nginxCertname,
		certificatePath: state.nginxCertpath,
		defaultUrl: state.nginxDefaulturl,
		httpPort: Number(state.nginxPort),
		httpsPort: Number(state.nginxPortssl),
		lanFqdn: state.nginxLanfqdn,
		lanFqdn6: state.nginxLanfqdn6,
		lanIp: state.nginxLanip,
		lanIp6: state.nginxLanip6,
		lanMdns: state.nginxLanmdns,
		lanName: state.nginxLanname,
		sslEnabled: state.nginxUsessl !== 'no',
		sslMode: state.nginxUsessl,
		wanAccessEnabled: state.nginxWanaccess === 'yes',
		wanFqdn: state.nginxWanfqdn,
		wanFqdn6: state.nginxWanfqdn6,
		wanIp: state.nginxWanip,
		wgFqdns: wireguardUrls,
	};
};
