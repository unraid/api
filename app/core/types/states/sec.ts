import { IniEnabled } from '../ini';

export interface SecIni {
	name: string;
	export: IniEnabled;
	writeList: string;
	readList: string;
}
