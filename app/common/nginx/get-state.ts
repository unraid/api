import { existsSync } from 'fs';
import { paths } from '../../core';
import { loadState } from '../../core/utils/misc/load-state';
import { NginxState } from '../../types/nginx';

export const getNginxState = () => {
	const filePath = paths.get('nginx-state')!;
	if (!existsSync(filePath)) return {};
	const state = loadState<Partial<NginxState>>(filePath);
	return {
		lan: state.nginxLanfqdn,
		wan: state.nginxWanfqdn
	};
};
