/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

import path from 'path';
import uptime from 'os-uptime';
import { paths } from '../paths';
import { Var } from '../types/states';
import { IniStringBooleanOrAuto, IniStringBoolean } from '../types/ini';
import { State } from './state';
import { toNumber } from '../utils/casting';
import { parseConfig } from '../utils/misc';

const iniBooleanToJsBoolean = (value: IniStringBoolean | string) => {
	if (value === 'no') {
		return false;
	}

	if (value === 'yes') {
		return true;
	}

	throw new Error(`Value "${value}" is not no/yes.`);
};

const iniBooleanOrAutoToJsBoolean = (value: IniStringBooleanOrAuto | string) => {
	try {
		// Either it'll return true/false or throw
		return iniBooleanToJsBoolean((value as IniStringBoolean));
	} catch {
		// Auto or null
		if (value === 'auto') {
			return null;
		}
	}

	throw new Error(`Value "${value}" is not auto/no/yes.`);
};

/**
 * Unraid registation check
 */
type RegistationCheck =
	/** Key file is missing. */
	'ENOKEYFILE2' |
	/** Everything is fine. */
	'';

/**
 * Unraid registation type
 *
 * Check the {@link https://unraid.net/pricing | pricing page} for up to date info.
 */
type RegistationType =
	/** Missing key file. */
	'- missing key file' |
	/** Up to 6 attached storage devices. */
	'Basic' |
	/** Up to 12 attached storage devices. */
	'Plus' |
	/** Unlimited attached storage devices. */
	'Pro';

interface VarIni {
	bindMgt: IniStringBooleanOrAuto;
	cacheNumDevices: string;
	cacheSbNumDisks: string;
	comment: string;
	configValid: string;
	csrfToken: string;
	defaultFormat: string;
	defaultFsType: string;
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
	regCheck: RegistationCheck;
	regFile: string;
	regGen: string;
	regGuid: string;
	regTm: string;
	regTm2: string;
	regTo: string;
	regTy: RegistationType;
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
	uptime: string;
	useNtp: IniStringBoolean;
	useSsh: IniStringBoolean;
	useSsl: IniStringBooleanOrAuto;
	useTelnet: string;
	version: string;
	workgroup: string;
}

const parse = (state: VarIni): Var => {
	return {
		...state,
		bindMgt: iniBooleanOrAutoToJsBoolean(state.bindMgt),
		cacheNumDevices: toNumber(state.cacheNumDevices),
		cacheSbNumDisks: toNumber(state.cacheSbNumDisks),
		configValid: state.configValid === 'error' ? false : iniBooleanToJsBoolean(state.configValid),
		deviceCount: toNumber(state.deviceCount),
		fsCopyPrcnt: toNumber(state.fsCopyPrcnt),
		fsNumMounted: toNumber(state.fsNumMounted),
		fsNumUnmountable: toNumber(state.fsNumUnmountable),
		hideDotFiles: iniBooleanToJsBoolean(state.hideDotFiles),
		localMaster: iniBooleanToJsBoolean(state.localMaster),
		maxArraysz: toNumber(state.maxArraysz),
		maxCachesz: toNumber(state.maxCachesz),
		mdNumDisabled: toNumber(state.mdNumDisabled),
		mdNumDisks: toNumber(state.mdNumDisks),
		mdNumErased: toNumber(state.mdNumErased),
		mdNumInvalid: toNumber(state.mdNumInvalid),
		mdNumMissing: toNumber(state.mdNumMissing),
		mdNumNew: toNumber(state.mdNumNew),
		mdNumStripes: toNumber(state.mdNumStripes),
		mdNumStripesDefault: toNumber(state.mdNumStripesDefault),
		mdResync: toNumber(state.mdResync),
		mdResyncPos: toNumber(state.mdResyncPos),
		mdResyncSize: toNumber(state.mdResyncSize),
		mdSyncThresh: toNumber(state.mdSyncThresh),
		mdSyncThreshDefault: toNumber(state.mdSyncThreshDefault),
		mdSyncWindow: toNumber(state.mdSyncWindow),
		mdSyncWindowDefault: toNumber(state.mdSyncWindowDefault),
		mdWriteMethod: toNumber(state.mdWriteMethod),
		nrRequests: toNumber(state.nrRequests),
		nrRequestsDefault: toNumber(state.nrRequestsDefault),
		port: toNumber(state.port),
		portssh: toNumber(state.portssh),
		portssl: toNumber(state.portssl),
		porttelnet: toNumber(state.porttelnet),
		regCheck: state.regCheck === '' ? 'Valid' : 'Error',
		regTy: ['Basic', 'Plus', 'Pro'].includes(state.regTy) ? state.regTy : 'Invalid',
		safeMode: iniBooleanToJsBoolean(state.safeMode),
		sbClean: iniBooleanToJsBoolean(state.sbClean),
		sbEvents: toNumber(state.sbEvents),
		sbNumDisks: toNumber(state.sbNumDisks),
		sbSynced: toNumber(state.sbSynced),
		sbSynced2: toNumber(state.sbSynced2),
		sbSyncErrs: toNumber(state.sbSyncErrs),
		shareAvahiEnabled: iniBooleanToJsBoolean(state.shareAvahiEnabled),
		shareCacheEnabled: iniBooleanToJsBoolean(state.shareCacheEnabled),
		shareCount: toNumber(state.shareCount),
		shareMoverActive: iniBooleanToJsBoolean(state.shareMoverActive),
		shareMoverLogging: iniBooleanToJsBoolean(state.shareMoverLogging),
		shareNfsCount: toNumber(state.shareNfsCount),
		shareNfsEnabled: iniBooleanToJsBoolean(state.shareNfsEnabled),
		shareSmbCount: toNumber(state.shareSmbCount),
		shareSmbEnabled: iniBooleanToJsBoolean(state.shareSmbEnabled),
		shutdownTimeout: toNumber(state.shutdownTimeout),
		spindownDelay: toNumber(state.spindownDelay),
		spinupGroups: iniBooleanToJsBoolean(state.spinupGroups),
		startArray: iniBooleanToJsBoolean(state.startArray),
		sysArraySlots: toNumber(state.sysArraySlots),
		sysCacheSlots: toNumber(state.sysCacheSlots),
		sysFlashSlots: toNumber(state.sysFlashSlots),
		useNtp: iniBooleanToJsBoolean(state.useNtp),
		useSsh: iniBooleanToJsBoolean(state.useSsh),
		useSsl: iniBooleanOrAutoToJsBoolean(state.useSsl),
		useTelnet: iniBooleanToJsBoolean(state.useTelnet),
		uptime: uptime().toISOString()
	};
};

interface ParseOptions {
	/** If the internal store should be updated with the new data. */
	set?: boolean;
	/** If the main bus should recieve an event with the new data. */
	emit?: boolean;
}

class VarState extends State {
	private static instance: VarState;

	constructor() {
		super();

		if (VarState.instance) {
			return VarState.instance;
		}

		VarState.instance = this;
	}

	get data() {
		if (!this._data) {
			const statesDirectory = paths.get('states')!;
			const statePath = path.join(statesDirectory, 'var.ini');
			const state = parseConfig<VarIni>({
				filePath: statePath,
				type: 'ini'
			});
			this._data = this.parse(state);
		}

		return this._data;
	}

	parse(state: VarIni, options?: ParseOptions): Var {
		const { set, emit } = { emit: true, set: true, ...options };
		const data = parse(state);

		// Update var channel with new data
		if (emit) {
			this.emit('UPDATED', data);
		}

		if (set) {
			this.set(data);
		}

		return data;
	}
}

export const varState = new VarState();
