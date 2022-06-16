import { IniEnabled } from '@app/core/types/ini';

export interface SecIni {
	name: string;
	export: IniEnabled;
	writeList: string;
	readList: string;
}
