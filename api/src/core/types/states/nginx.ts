export interface FqdnEntry {
    interface: string;
    id: number | null;
    fqdn: string;
    isIpv6: boolean;
}

export interface Nginx {
    certificateName: string;
    certificatePath: string;
    defaultUrl: string;
    httpPort: number;
    httpsPort: number;
    lanIp: string;
    lanIp6: string;
    lanMdns: string;
    lanName: string;
    sslEnabled: boolean;
    sslMode: 'yes' | 'no' | 'auto';
    wanAccessEnabled: boolean;
    wanIp: string;
    fqdnUrls: FqdnEntry[];
}
