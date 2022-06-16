import { logger } from '@app/core/log';
import { networkState, varState } from '@app/core/states';
import { myServersConfig } from '@app/common/myservers-config';
import { getNginxState } from '@app/common/nginx/get-state';

// Get nginx state
export const nginx = getNginxState();

logger.debug('Initial extra origins set origins="%s"', myServersConfig?.api?.extraOrigins ?? '');

// To add additional origins add a field to your myservers.cfg called "extraOrigins" with a comma separated string
export const origins = {
	extra: typeof myServersConfig?.api?.extraOrigins === 'string' ? (myServersConfig.api.extraOrigins?.split(',') ?? []) : []
};

const allowedSocks = [
	// Notifier bridge
	'/var/run/unraid-notifications.sock',

	// Unraid PHP scripts
	'/var/run/unraid-php.sock',

	// CLI
	'/var/run/unraid-cli.sock'
];

const createWanHashOrigins = ({ wanAccessEnabled, wanHTTPSPort }: { wanAccessEnabled: boolean; wanHTTPSPort: string }) => [
	// WAN hash IPV4
	...(nginx.ipv4?.wan && wanAccessEnabled ? [`https://${nginx.ipv4.wan}${wanHTTPSPort ? `:${wanHTTPSPort}` : ''}`] : []),

	// WAN hash IPV6
	...(nginx.ipv6?.wan && wanAccessEnabled ? [`https://${nginx.ipv6.wan}${wanHTTPSPort ? `:${wanHTTPSPort}` : ''}`] : [])
];

const createLanHashOrigins = ({ webuiHTTPSPort }: { webuiHTTPSPort: number | string }) => [
	// LAN hash IPV4
	...(nginx.ipv4?.lan ? [`https://${nginx.ipv4.lan}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`] : []),

	// LAN hash IPV6
	...(nginx.ipv6?.lan ? [`https://${nginx.ipv6.lan}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`] : [])
];

export const getAllowedOrigins = (): string[] => {
	// Get local ip from first ethernet adapter in the "network" state
	const localIp = networkState.data[0].ipaddr[0] as string;

	// Get local tld (in lowercase)
	const localTld = varState.data.localTld.toLowerCase();

	// Get server's hostname (in lowercase)
	const serverName = varState.data.name.toLowerCase();

	// Get webui http port (default to 80)
	const webuiHTTPPort = (varState.data.port ?? 80) === 80 ? '' : varState.data.port;

	// Get webui https port (default to 443)
	const webuiHTTPSPort = (varState.data.portssl ?? 443) === 443 ? '' : varState.data.portssl;

	// Get wan https port (default to 443)
	const wanHTTPSPort = parseInt(myServersConfig?.remote?.wanport ?? '', 10) === 443 ? '' : (myServersConfig?.remote?.wanport ?? '');

	// Check if wan access is enabled
	const wanAccessEnabled = myServersConfig?.remote?.wanaccess === 'yes';

	// Get IP address origins
	const ipOrigins = [
		`http://${localIp}${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,
		`https://${localIp}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`
	];

	// Get local TLD address origins
	const tldOrigins = [
		// Raw local TLD
		`http://${serverName}${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,
		`https://${serverName}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`,

		// Local TLD
		`http://${serverName}.${localTld}${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,
		`https://${serverName}.${localTld}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`
	];

	// Get origins for LAN access with hash cert
	const lanHashOrigins = createLanHashOrigins({ webuiHTTPSPort });

	// Get origins for WAN access with hash cert
	const wanHashOrigins = createWanHashOrigins({ wanAccessEnabled, wanHTTPSPort });

	// Only append the port if it's not HTTP/80 or HTTPS/443
	// We use a "Set" + "array spread" to deduplicate the origins
	return [...new Set([
		// Localhost - Used for GUI mode
		`http://localhost${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,
		...ipOrigins,
		...tldOrigins,
		...lanHashOrigins,
		...wanHashOrigins,
		...allowedSocks,
		...origins.extra
	]).values()].filter(Boolean);
};
