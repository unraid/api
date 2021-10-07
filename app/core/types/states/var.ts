/*!
 * Copyright 2019-2021 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

type FsType = 'xfs' | string;
type RegistrationType = 'INVALID' | 'TRIAL' | 'BASIC' | 'PLUS' | 'PRO' | string;

/**
 * Global vars
 */
export interface Var {
	bindMgt: boolean | null;
	cacheNumDevices: number;
	cacheSbNumDisks: number;
	/** Description of your server (displayed in the "webGui"). */
	comment: string;
	/** Is the array's config valid. */
	configValid: boolean;
	/** @internal used to hold the value for config.error */
	configState: string;
	/** Current CSRF token for HTTP requests with emhttpd. */
	csrfToken: string;
	defaultFormat: string;
	/** Default file system for data disks. */
	defaultFsType: FsType;
	/** Amount of connected drives (license device count). */
	deviceCount: number;
	domain: string;
	domainLogin: string;
	domainShort: string;
	flashGuid: string;
	flashProduct: string;
	flashVendor: string;
	/** Current progress of the {@link ?content=mover | mover}. */
	fsCopyPrcnt: number;
	fsNumMounted: number;
	fsNumUnmountable: number;
	fsProgress: string;
	/** Current state of the array. */
	fsState: string;
	fsUnmountableMask: string;
	fuseDirectio: string;
	fuseDirectioDefault: string;
	fuseDirectioStatus: string;
	fuseRemember: string;
	fuseRememberDefault: string;
	fuseRememberStatus: string;
	hideDotFiles: boolean;
	// JoinStatus
	localMaster: boolean;
	/** The local tld to use e.g. `.local`. */
	localTld: string;
	/** Absolute file path to the data disks' luks key. */
	luksKeyfile: string;
	maxArraysz: number; /** Max amount of data drives allowed in the array. */
	maxCachesz: number; /** Max amount of cache drives allowed in the array. */
	mdColor: string;
	/** The amount of {@link ?content=array#disks-disabled | disabled disks} from the current array. */
	mdNumDisabled: number;
	mdNumDisks: number;
	mdNumErased: number;
	/** The amount of {@link ?content=array#disks-invalid | invalid disks} from the current array. */
	mdNumInvalid: number;
	/** The amount of {@link ?content=array#disks-missing | missing disks} from the current array. */
	mdNumMissing: number;
	mdNumNew: number;
	mdNumStripes: number;
	mdNumStripesDefault: number;
	mdNumStripesStatus: string;
	mdResync: number;
	mdResyncAction: string;
	mdResyncCorr: string;
	mdResyncDb: string;
	mdResyncDt: string;
	mdResyncPos: number;
	mdResyncSize: number;
	mdState: string;
	mdSyncThresh: number;
	mdSyncThreshDefault: number;
	mdSyncThreshStatus: string;
	mdSyncWindow: number;
	mdSyncWindowDefault: number;
	mdSyncWindowStatus: string;
	mdVersion: string;
	mdWriteMethod: number;
	mdWriteMethodDefault: string;
	mdWriteMethodStatus: string;
	/** Machine hostname. */
	name: string;
	// NrRequests
	nrRequests: number;
	// NrRequestsDefault
	nrRequestsDefault: number;
	// NrRequestsStatus
	/** NTP Server 1. */
	ntpServer1: string;
	/** NTP Server 2. */
	ntpServer2: string;
	/** NTP Server 3. */
	ntpServer3: string;
	/** NTP Server 4. */
	ntpServer4: string;
	pollAttributes: string;
	pollAttributesDefault: string;
	pollAttributesStatus: string;
	/** Port for the webui via HTTP. */
	port: number;
	/** Port for SSH daemon. */
	portssh: number;
	/** Port for the webui via HTTPS. */
	portssl: number;
	/** Port for telnet daemon. */
	porttelnet: number;
	queueDepth: string;
	regCheck: string;
	regState: string;
	/** Where the registration key is stored. (e.g. "/boot/config/Pro.key") */
	regFile: string;
	regGen: string;
	regGuid: string;
	regTm: string;
	regTm2: string;
	/** Who the current Unraid key is registered to. */
	regTo: string;
	/** Which type of key this is. */
	regTy: RegistrationType;
	/** Is the server currently in safe mode. */
	safeMode: boolean;
	sbClean: boolean;
	sbEvents: number;
	sbName: string;
	sbNumDisks: number;
	sbState: string;
	sbSynced: number;
	sbSynced2: number;
	sbSyncErrs: number;
	sbSyncExit: string;
	sbUpdated: string;
	sbVersion: string;
	security: string;
	shareAvahiEnabled: boolean;
	shareAvahiSmbModel: string;
	shareAvahiSmbName: string;
	shareCacheEnabled: boolean;
	shareCacheFloor: string;
	/** Total number of disk/user shares. */
	shareCount: number;
	shareDisk: string;
	shareInitialGroup: string;
	shareInitialOwner: string;
	/** If the {@link ?content=mover | mover} is currently active. */
	shareMoverActive: boolean;
	shareMoverLogging: boolean;
	/** When the share mover script should run. Takes cron format time. */
	shareMoverSchedule: string;
	/** Total number of NFS shares. */
	shareNfsCount: number;
	shareNfsEnabled: boolean;
	/** Total number of SMB shares. */
	shareSmbCount: number;
	/** Is smb enabled */
	shareSmbEnabled: boolean;
	/** Which mode is smb running in? active-directory | workgroup */
	shareSmbMode: string;
	shareUser: string;
	// ShareUserExclude
	shutdownTimeout: number;
	/** How long until emhttpd should spin down the data drives in your array. */
	spindownDelay: number;
	spinupGroups: boolean;
	/** Should the array be started by default on boot. */
	startArray: boolean;
	/** The default start mode for the server. */
	startMode: string;
	/** Which page to start the webGui on. */
	startPage: string;
	sysArraySlots: number;
	sysCacheSlots: number;
	sysFlashSlots: number;
	sysModel: string;
	/** Current timezone. {@link https://en.wikipedia.org/wiki/List_of_tz_database_time_zones | Timezone list}. */
	timeZone: string;
	/** Should a NTP server be used for time sync. */
	useNtp: boolean;
	/** Should SSH be enabled. */
	useSsh: boolean;
	/** If HTTPS should be be enabled in the webui. */
	useSsl: boolean | null;
	/** Should telnet be enabled. */
	useTelnet: boolean;
	/** The current Unraid version. */
	version: string;
	/** The SMB workgroup. */
	workgroup: string;
}
