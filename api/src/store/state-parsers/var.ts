import { type IniStringBoolean, type IniStringBooleanOrAuto } from '@app/core/types/ini';
import { type FsType, type RegistrationTypeAllCaps } from '@app/core/types/states/var';
import { toNumber } from '@app/core/utils';
import { ArrayState } from '@app/graphql/generated/api/types';
import type { StateFileToIniParserMap } from '@app/store/types';

/**
 * Unraid registration check
 */
type RegistrationCheck =
 /** Key file is missing. */
 'ENOKEYFILE2' |
 /** Everything is fine. */
 '';

/**
* Unraid registration type
*
* Check the {@link https://unraid.net/pricing | pricing page} for up to date info.
*/
type RegistrationType =
 /** Missing key file. */
 '- missing key file' |
 /** Free trial */
 'Trial' |
 /** Up to 6 attached storage devices. */
 'Basic' |
 /** Up to 12 attached storage devices. */
 'Plus' |
 /** Unlimited attached storage devices. */
 'Pro';

type RegistrationState =
 'TRIAL' |
 'BASIC' |
 'PLUS' |
 'PRO' |
 'EEXPIRED' |
 'EGUID' |
 'EGUID1' |
 'ETRIAL' |
 'ENOKEYFILE' |
 'ENOKEYFILE1' |
 'ENOKEYFILE2' |
 'ENOFLASH1' |
 'ENOFLASH2' |
 'ENOFLASH3' |
 'ENOFLASH4' |
 'ENOFLASH5' |
 'ENOFLASH6' |
 'ENOFLASH7' |
 'EBLACKLISTED' |
 'EBLACKLISTED1' |
 'EBLACKLISTED2' |
 'ENOCONN';

export type VarIni = {
	bindMgt: IniStringBooleanOrAuto;
	cacheNumDevices: string;
	cacheSbNumDisks: string;
	comment: string;
	configValid: string;
	configState: string;
	csrfToken: string;
	defaultFormat: string;
	defaultFsType: FsType;
	deviceCount: string;
	domain: string;
	domainLogin: string;
	domainShort: string;
	flashGuid: string;
	flashProduct: string;
	flashVendor: string;
	fsCopyPrcnt: string;
	fsNumMounted: string;
	fsNumUnmountable: string;
	fsProgress: string;
	fsState: string;
	fsUnmountableMask: string;
	fuseDirectio: string;
	fuseDirectioDefault: string;
	fuseDirectioStatus: string;
	fuseRemember: string;
	fuseRememberDefault: string;
	fuseRememberStatus: string;
	hideDotFiles: string;
	localMaster: string;
	localTld: string;
	luksKeyfile: string;
	maxArraysz: string;
	maxCachesz: string;
	mdColor: string;
	mdNumDisabled: string;
	mdNumDisks: string;
	mdNumErased: string;
	mdNumInvalid: string;
	mdNumMissing: string;
	mdNumNew: string;
	mdNumStripes: string;
	mdNumStripesDefault: string;
	mdNumStripesStatus: string;
	mdResync: string;
	mdResyncAction: string;
	mdResyncCorr: string;
	mdResyncDb: string;
	mdResyncDt: string;
	mdResyncPos: string;
	mdResyncSize: string;
	mdState: string;
	mdSyncThresh: string;
	mdSyncThreshDefault: string;
	mdSyncThreshStatus: string;
	mdSyncWindow: string;
	mdSyncWindowDefault: string;
	mdSyncWindowStatus: string;
	mdVersion: string;
	mdWriteMethod: string;
	mdWriteMethodDefault: string;
	mdWriteMethodStatus: string;
	name: string;
	nrRequests: string;
	nrRequestsDefault: string;
	ntpServer1: string;
	ntpServer2: string;
	ntpServer3: string;
	ntpServer4: string;
	pollAttributes: string;
	pollAttributesDefault: string;
	pollAttributesStatus: string;
	port: string;
	portssh: string;
	portssl: string;
	porttelnet: string;
	queueDepth: string;
	regCheck: RegistrationCheck;
	regFile: string;
	regGen: string;
	regGuid: string;
	regTm: string;
	regTm2: string;
	regTo: string;
	regTy: RegistrationType;
	regState: RegistrationState;
	safeMode: string;
	sbClean: string;
	sbEvents: string;
	sbName: string;
	sbNumDisks: string;
	sbState: string;
	sbSynced: string;
	sbSynced2: string;
	sbSyncErrs: string;
	sbSyncExit: string;
	sbUpdated: string;
	sbVersion: string;
	security: string;
	shareAvahiEnabled: string;
	shareAvahiSmbModel: string;
	shareAvahiSmbName: string;
	shareCacheEnabled: string;
	shareCacheFloor: string;
	shareCount: string;
	shareDisk: string;
	shareInitialGroup: string;
	shareInitialOwner: string;
	shareMoverActive: string;
	shareMoverLogging: string;
	shareMoverSchedule: string;
	shareNfsCount: string;
	shareNfsEnabled: string;
	shareSmbCount: string;
	shareSmbEnabled: string;
	shareUser: string;
	shareUserExclude: string;
	shutdownTimeout: string;
	spindownDelay: string;
	spinupGroups: string;
	startArray: string;
	startMode: string;
	startPage: string;
	sysArraySlots: string;
	sysCacheSlots: string;
	sysFlashSlots: string;
	sysModel: string;
	timeZone: string;
	useNtp: IniStringBoolean;
	useSsh: IniStringBoolean;
	useSsl: IniStringBooleanOrAuto;
	useTelnet: string;
	version: string;
	workgroup: string;
	useUpnp: IniStringBoolean;
};

const iniBooleanToJsBoolean = (value: string, defaultValue?: boolean) => {
	if (value === 'no' || value === 'false') {
		return false;
	}

	if (value === 'yes' || value === 'true') {
		return true;
	}

	if (defaultValue !== undefined) {
		return defaultValue;
	}

	throw new Error(`Value "${value}" is not false/true or no/yes.`);
};

const iniBooleanOrAutoToJsBoolean = (value: IniStringBooleanOrAuto) => {
	try {
		// Either it'll return true/false or throw
		return iniBooleanToJsBoolean((value as IniStringBoolean));
	} catch {
		// Auto or null
		if (value === 'auto') {
			return null;
		}
	}

	throw new Error(`Value "${value as string}" is not auto/no/yes.`);
};

const safeParseMdState = (mdState: string | undefined): ArrayState => {
	if (!mdState || typeof mdState !== 'string') {
		return ArrayState.STOPPED;
	}
	const stateUpper = mdState.toUpperCase()
	const attemptedParse =
        ArrayState[
            stateUpper.startsWith('ERROR')
                ? stateUpper.split(':')[1]
                : stateUpper
        ];

	if (!attemptedParse) {
		return ArrayState.STOPPED
	}
	return attemptedParse;
}

export const parse: StateFileToIniParserMap['var'] = iniFile => {
	return {
        ...iniFile,
        mdState: safeParseMdState(iniFile.mdState),
        bindMgt: iniBooleanOrAutoToJsBoolean(iniFile.bindMgt),
        cacheNumDevices: toNumber(iniFile.cacheNumDevices),
        cacheSbNumDisks: toNumber(iniFile.cacheSbNumDisks),
        configValid: iniBooleanToJsBoolean(iniFile.configValid, false),
        configState: iniFile.configValid,
        deviceCount: toNumber(iniFile.deviceCount),
        fsCopyPrcnt: toNumber(iniFile.fsCopyPrcnt),
        fsNumMounted: toNumber(iniFile.fsNumMounted),
        fsNumUnmountable: toNumber(iniFile.fsNumUnmountable),
        hideDotFiles: iniBooleanToJsBoolean(iniFile.hideDotFiles),
        localMaster: iniBooleanToJsBoolean(iniFile.localMaster),
        maxArraysz: toNumber(iniFile.maxArraysz),
        maxCachesz: toNumber(iniFile.maxCachesz),
        mdNumDisabled: toNumber(iniFile.mdNumDisabled),
        mdNumDisks: toNumber(iniFile.mdNumDisks),
        mdNumErased: toNumber(iniFile.mdNumErased),
        mdNumInvalid: toNumber(iniFile.mdNumInvalid),
        mdNumMissing: toNumber(iniFile.mdNumMissing),
        mdNumNew: toNumber(iniFile.mdNumNew),
        mdNumStripes: toNumber(iniFile.mdNumStripes),
        mdNumStripesDefault: toNumber(iniFile.mdNumStripesDefault),
        mdResync: toNumber(iniFile.mdResync),
        mdResyncPos: toNumber(iniFile.mdResyncPos),
        mdResyncSize: toNumber(iniFile.mdResyncSize),
        mdSyncThresh: toNumber(iniFile.mdSyncThresh),
        mdSyncThreshDefault: toNumber(iniFile.mdSyncThreshDefault),
        mdSyncWindow: toNumber(iniFile.mdSyncWindow),
        mdSyncWindowDefault: toNumber(iniFile.mdSyncWindowDefault),
        mdWriteMethod: toNumber(iniFile.mdWriteMethod),
        nrRequests: toNumber(iniFile.nrRequests),
        nrRequestsDefault: toNumber(iniFile.nrRequestsDefault),
        port: toNumber(iniFile.port),
        portssh: toNumber(iniFile.portssh),
        portssl: toNumber(iniFile.portssl),
        porttelnet: toNumber(iniFile.porttelnet),
        regCheck: iniFile.regCheck === '' ? 'Valid' : 'Error',
        regTy: (['Basic', 'Plus', 'Pro', 'Trial'].includes(iniFile.regTy)
            ? iniFile.regTy
            : 'Invalid'
        ).toUpperCase() as RegistrationTypeAllCaps,
        // Make sure to use a || not a ?? as regCheck can be an empty string
        regState: (iniFile.regCheck || iniFile.regTy).toUpperCase(),
        safeMode: iniBooleanToJsBoolean(iniFile.safeMode),
        sbClean: iniBooleanToJsBoolean(iniFile.sbClean),
        sbEvents: toNumber(iniFile.sbEvents),
        sbNumDisks: toNumber(iniFile.sbNumDisks),
        sbSynced: toNumber(iniFile.sbSynced),
        sbSynced2: toNumber(iniFile.sbSynced2),
        sbSyncErrs: toNumber(iniFile.sbSyncErrs),
        shareAvahiEnabled: iniBooleanToJsBoolean(iniFile.shareAvahiEnabled),
        shareCacheEnabled: iniBooleanToJsBoolean(iniFile.shareCacheEnabled),
        shareCount: toNumber(iniFile.shareCount),
        shareMoverActive: iniBooleanToJsBoolean(iniFile.shareMoverActive),
        shareMoverLogging: iniBooleanToJsBoolean(iniFile.shareMoverLogging),
        shareNfsCount: toNumber(iniFile.shareNfsCount),
        shareNfsEnabled: iniBooleanToJsBoolean(iniFile.shareNfsEnabled),
        shareSmbCount: toNumber(iniFile.shareSmbCount),
        shareSmbEnabled: ['yes', 'ads'].includes(iniFile.shareSmbEnabled),
        shareSmbMode:
            iniFile.shareSmbEnabled === 'ads'
                ? 'active-directory'
                : 'workgroup',
        shutdownTimeout: toNumber(iniFile.shutdownTimeout),
        spindownDelay: toNumber(iniFile.spindownDelay),
        spinupGroups: iniBooleanToJsBoolean(iniFile.spinupGroups),
        startArray: iniBooleanToJsBoolean(iniFile.startArray),
        sysArraySlots: toNumber(iniFile.sysArraySlots),
        sysCacheSlots: toNumber(iniFile.sysCacheSlots),
        sysFlashSlots: toNumber(iniFile.sysFlashSlots),
        useNtp: iniBooleanToJsBoolean(iniFile.useNtp),
        useSsh: iniBooleanToJsBoolean(iniFile.useSsh),
        useSsl: iniBooleanOrAutoToJsBoolean(iniFile.useSsl),
        useTelnet: iniBooleanToJsBoolean(iniFile.useTelnet),
        useUpnp: iniBooleanToJsBoolean(iniFile.useUpnp),
    };
};
