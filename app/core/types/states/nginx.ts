export interface Nginx {
	lanIp: string;
	lanName: string;
	lanMdns: string;
	certificatePath: string;
	sslMode: 'yes' | 'no' | 'auto';
	sslEnabled: boolean;
	httpPort: number;
	httpsPort: number;
	certificateName: string;
	lanFqdn: string;
	wanFqdn: string;
	wanIp: string;
}
