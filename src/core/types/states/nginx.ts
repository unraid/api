export interface Nginx {
	certificateName: string;
	certificatePath: string;
	defaultUrl: string;
	httpPort: number;
	httpsPort: number;
	lanFqdn: string;
	lanIp: string;
	lanMdns: string;
	lanName: string;
	sslEnabled: boolean;
	sslMode: 'yes' | 'no' | 'auto';
	wanAccessEnabled: boolean;
	wanFqdn: string;
	wanIp: string;
}
