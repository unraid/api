import { getters } from '@app/store';

const allowedSocks = [
	// Notifier bridge
	'/var/run/unraid-notifications.sock',

	// Unraid PHP scripts
	'/var/run/unraid-php.sock',

	// CLI
	'/var/run/unraid-cli.sock',
];

const createWanHashOrigins = ({ wanAccessEnabled, wanHTTPSPort }: { wanAccessEnabled: boolean; wanHTTPSPort: string }) => [
	// WAN hash IPV4
	...(getters.nginx().ipv4.wan && wanAccessEnabled ? [`https://${getters.nginx().ipv4.wan ?? ''}${wanHTTPSPort ? `:${wanHTTPSPort}` : ''}`] : []),

	// WAN hash IPV6
	...(getters.nginx().ipv6.wan && wanAccessEnabled ? [`https://${getters.nginx().ipv6.wan ?? ''}${wanHTTPSPort ? `:${wanHTTPSPort}` : ''}`] : []),
];

const createLanHashOrigins = ({ webuiHTTPSPort }: { webuiHTTPSPort: number | string }) => [
	// LAN hash IPV4
	...(getters.nginx().ipv4.lan ? [`https://${getters.nginx().ipv4.lan ?? ''}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`] : []),

	// LAN hash IPV6
	...(getters.nginx().ipv6.lan ? [`https://${getters.nginx().ipv6.lan ?? ''}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`] : []),
];

export const getAllowedOrigins = (): string[] => {
	const config = getters.config();
	const emhttp = getters.emhttp();

	// Get local ip from first ethernet adapter in the "network" state
	const localIp = emhttp.networks[0].ipaddr[0];

	// Get local tld (in lowercase)
	const localTld = emhttp.var.localTld.toLowerCase();

	// Get server's hostname (in lowercase)
	const serverName = emhttp.var.name.toLowerCase();

	// Get webui http port (default to 80)
	const webuiHTTPPort = (emhttp.var.port ?? 80) === 80 ? '' : emhttp.var.port;

	// Get webui https port (default to 443)
	const webuiHTTPSPort = (emhttp.var.portssl ?? 443) === 443 ? '' : emhttp.var.portssl;

	// Get wan https port (default to 443)
	const wanHTTPSPort = parseInt(config.remote.wanport ?? '', 10) === 443 ? '' : (config.remote.wanport ?? '');

	// Check if wan access is enabled
	const wanAccessEnabled = getters.config().remote.wanaccess === 'yes';

	// Get IP address origins
	const ipOrigins = [
		`http://${localIp}${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,
		`https://${localIp}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`,
	];

	// Get local TLD address origins
	const tldOrigins = [
		// Raw local TLD
		`http://${serverName}${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,
		`https://${serverName}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`,

		// Local TLD
		`http://${serverName}.${localTld}${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,
		`https://${serverName}.${localTld}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`,
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
		...getters.config().api.extraOrigins.split(', ').filter(origin => origin.startsWith('http://') || origin.startsWith('https://')),
	]).values()].filter(Boolean);
};
