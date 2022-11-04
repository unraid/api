type Device = {};

export type DevicesIni = Array<Record<string, unknown>>;

export const parse = (iniFile: DevicesIni): Device[] => Object.values(iniFile);
