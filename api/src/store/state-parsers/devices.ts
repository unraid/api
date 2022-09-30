type Device = {};

type DeviceIni = {};

export const parse = (iniFile: DeviceIni[]): Device[] => Object.values(iniFile);
