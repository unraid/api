import { type IniEnabled } from '@app/core/types/ini.js';

export interface SecIni {
    export: IniEnabled;
    writeList: string;
    readList: string;
}
