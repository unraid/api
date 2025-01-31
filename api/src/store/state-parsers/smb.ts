import type { StateFileToIniParserMap } from '@app/store/types';
import { type SecIni } from '@app/core/types/states/sec';
import { type SmbSecurity, type SmbShares } from '@app/core/types/states/smb';

export interface IniSmbShare extends SecIni {
    /**
     * This limits the reported volume size, preventing TimeMachine from using the entire real disk space for backup.
     * For example, setting this value to "1024" would limit the reported disk space to 1GB.
     */
    volsizelimit: string;
    security: SmbSecurity;
}

export type SmbIni = IniSmbShare[];

export const parse: StateFileToIniParserMap['sec'] = (state) =>
    Object.entries(state).map(([name, state]) => {
        const { export: enabled, security, writeList, readList, volsizelimit, ...rest } = state;

        return {
            name,
            enabled: enabled === 'e',
            security,
            writeList: writeList ? writeList.split(',') : [],
            readList: readList ? readList.split(',') : [],
            timemachine: {
                volsizelimit: Number.parseInt(volsizelimit, 10),
            },
            ...rest,
        };
    }) as SmbShares;
