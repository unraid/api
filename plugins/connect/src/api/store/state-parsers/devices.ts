import type { StateFileToIniParserMap } from '@app/store/types.js';

export type DevicesIni = Array<Record<string, unknown>>;

export const parse: StateFileToIniParserMap['devs'] = (iniFile) => Object.values(iniFile);
