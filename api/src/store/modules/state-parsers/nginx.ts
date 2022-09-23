import { IniStringBooleanOrAuto } from '@app/core/types/ini';
import { Nginx } from '@app/core/types/states/nginx';

export type NginxIni = {
	nginxCertname: string;
	nginxCertpath: string;
	nginxDefaulturl: string;
	nginxLanfqdn: string;
	nginxLanfqdn6: string;
	nginxLanip: string;
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

export const parse = (state: NginxIni): Nginx => ({
	certificateName: state.nginxCertname,
	certificatePath: state.nginxCertpath,
	defaultUrl: state.nginxDefaulturl,
	httpPort: Number(state.nginxPort),
	httpsPort: Number(state.nginxPortssl),
	lanFqdn: state.nginxLanfqdn,
	lanFqdn6: state.nginxLanfqdn6,
	lanIp: state.nginxLanip,
	lanMdns: state.nginxLanmdns,
	lanName: state.nginxLanname,
	sslEnabled: state.nginxUsessl !== 'no',
	sslMode: state.nginxUsessl,
	wanAccessEnabled: state.nginxWanaccess === 'yes',
	wanFqdn: state.nginxWanfqdn,
	wanFqdn6: state.nginxWanfqdn6,
	wanIp: state.nginxWanip,
});
