import { existsSync } from 'fs';
import { paths } from '@app/core/paths';
import { loadState } from '@app/core/utils/misc/load-state';
import { NginxState } from '@app/types/nginx';

export const getNginxState = () => {
	const filePath = paths['nginx-state'];
	if (!existsSync(filePath)) return {};
	const state = loadState<Partial<NginxState>>(filePath);
	return {
		ipv4: {
			lan: state?.nginxLanfqdn,
			wan: state?.nginxWanfqdn
		},
		ipv6: {
			lan: state?.nginxLanfqdn6,
			wan: state?.nginxWanfqdn6
		}
	};
};
