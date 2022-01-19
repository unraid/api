import { existsSync } from 'fs';
import { loadState } from '../../core/utils/misc/load-state';
import { NginxState } from '../../types/nginx';

export const getNginxState = () => {
	const filePath = '/var/local/nginx/state.ini';
	if (!existsSync(filePath)) return {};
	const state = loadState<Partial<NginxState>>(filePath);
	return {
		lan: state.nginxLanfqdn,
		wan: state.nginxWanfqdn
	};
};
