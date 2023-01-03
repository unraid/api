import type { IniStringBooleanOrAuto } from '@app/core/types/ini';
import type { StateFileToIniParserMap } from '@app/store/types';

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
};

export const parse: StateFileToIniParserMap['nginx'] = state => ({
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
});
