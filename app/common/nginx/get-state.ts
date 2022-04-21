import { existsSync } from 'fs';
import { paths } from '../../core/paths';
import { loadState } from '../../core/utils/misc/load-state';
import { NginxState } from '../../types/nginx';

export const getNginxState = () => {
	const filePath = paths['nginx-state'];
	if (!existsSync(filePath)) return {};
	const state = loadState<Partial<NginxState>>(filePath);
	return {
		lan: state?.nginxLanfqdn,
		wan: state?.nginxWanfqdn
	};
};
