import { logger } from '../core/log';
import { paths } from '../core/paths';
import { networkState, varState } from '../core/states';
import { loadState } from '../core/utils/misc/load-state';
import { MyServersConfig } from '../types/my-servers-config';
import { getNginxState } from './nginx/get-state';

// Get nginx state
export const nginx = getNginxState();

const configPath = paths['myservers-config'];
export const myServersConfig = loadState<Partial<MyServersConfig>>(configPath) ?? {};

logger.debug('Initial extra origins set origins="%s"', myServersConfig?.api?.extraOrigins ?? '');

// To add additional origins add a field to your myservers.cfg called "extraOrigins" with a comma separated string
export const origins = {
	extra: typeof myServersConfig?.api?.extraOrigins === 'string' ? (myServersConfig.api.extraOrigins?.split(',') ?? []) : []
};

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

	logger.debug('Using the following for generating the allowed origins', {
		localIp,
		localTld,
		serverName,
		webuiHTTPPort,
		webuiHTTPSPort,
		wanHTTPSPort,
		wanAccessEnabled
	});

	// Only append the port if it's not HTTP/80 or HTTPS/443
	// We use a "Set" + "array spread" to deduplicate the strings
	return [...new Set([
		// Localhost - Used for GUI mode
		`http://localhost${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,

		// IP
		`http://${localIp}${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,
		`https://${localIp}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`,

		// Raw local TLD
		`http://${serverName}${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,
		`https://${serverName}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`,

		// Local TLD
		`http://${serverName}.${localTld}${webuiHTTPPort ? `:${webuiHTTPPort}` : ''}`,
		`https://${serverName}.${localTld}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`,

		// LAN hash
		...(nginx.lan ? [`https://${nginx.lan}${webuiHTTPSPort ? `:${webuiHTTPSPort}` : ''}`] : []),

		// WAN hash
		...(nginx.wan && wanAccessEnabled ? [`https://${nginx.wan}${wanHTTPSPort ? `:${wanHTTPSPort}` : ''}`] : []),

		// Notifier bridge
		'/var/run/unraid-notifications.sock',

		// Unraid PHP scripts
		'/var/run/unraid-php.sock',

		// CLI
		'/var/run/unraid-cli.sock',

		// Other endpoints should be added below
		...origins.extra
	]).values()].filter(Boolean);
};
