import { existsSync } from 'fs';
import { loadState } from '../../core/utils/misc/load-state';
import { NginxState } from '../../types/nginx';

export const getNginxState = () => {
	const filePath = '/var/local/nginx/state.ini';
	if (!existsSync(filePath)) return {};
	return loadState<Partial<NginxState>>(filePath);
};
