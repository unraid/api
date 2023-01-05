export interface WireguardFqdn {
	id: number;
	fqdn: string;
}

export interface Nginx {
	certificateName: string;
	certificatePath: string;
	defaultUrl: string;
	httpPort: number;
	httpsPort: number;
	lanFqdn: string;
	lanFqdn6: string;
	lanIp: string;
	lanIp6: string;
	lanMdns: string;
	lanName: string;
	sslEnabled: boolean;
	sslMode: 'yes' | 'no' | 'auto';
	wanAccessEnabled: boolean;
	wanFqdn: string;
	wanFqdn6: string;
	wanIp: string;
	wgFqdns: WireguardFqdn[];
}
