import { paths } from '../core/paths';
import { loadState } from '../core/utils/misc/load-state';
import { MyServersConfig } from '../types/my-servers-config';

// Get myservers config
const configPath = paths['myservers-config'];
export const myServersConfig = loadState<Partial<MyServersConfig>>(configPath) ?? {};
