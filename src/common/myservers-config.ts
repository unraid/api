import { paths } from '@app/core/paths';
import { loadState } from '@app/core/utils/misc/load-state';
import { MyServersConfig } from '@app/types/my-servers-config';

// Get myservers config
const configPath = paths['myservers-config'];
export const myServersConfig = loadState<Partial<MyServersConfig>>(configPath) ?? {};
