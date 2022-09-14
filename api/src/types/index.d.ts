declare module '*.json';

declare module 'dedent-tabs' {
	function dedentTabs(
		strings: TemplateStringsArray,
		...args: Array<string | number>
	): string;
	export = dedentTabs;
}

// This is needed since devs working on Windows can't always install this module but we still need the types
// License: MIT
// Link: https://github.com/vmngr/libvirt-old/blob/a629e6b76295d77785410dd574e0d730b762fce0/lib/bindings.ts

declare module '@vmngr/libvirt' {
	export declare interface HypervisorOptions {
		uri: string;
	}

	export declare const enum ConnectListAllDomainsFlags {
		ACTIVE = 1,
		INACTIVE = 2,
		PERSISTENT = 4,
		TRANSIENT = 8,
		RUNNING = 16,
		PAUSED = 32,
		SHUTOFF = 64,
		OTHER = 128,
		MANAGEDSAVE = 256,
		NO_MANAGEDSAVE = 512,
		AUTOSTART = 1_024,
		NO_AUTOSTART = 2_048,
		HAS_SNAPSHOT = 4_096,
		NO_SNAPSHOT = 8_192,
		HAS_CHECKPOINT = 16_384,
		NO_CHECKPOINT = 32_768,
	}

	export declare const enum DomainGetXMLDescFlags {
		SECURE = 1,
		INACTIVE = 2,
		UPDATE_CPU = 4,
		MIGRATABLE = 8,
	}

	// eslint-disable-next-line @typescript-eslint/no-extraneous-class
	export declare class Domain {}

	export declare class Hypervisor {
		constructor(options: HypervisorOptions);

		connectOpen(): Promise<void>;
		connectClose(): Promise<void>;
		connectListAllDomains(flags?: ConnectListAllDomainsFlags): Promise<Domain[]>;
		connectListDomains(): Promise<number[]>;
		connectListDefinedDomains(): Promise<string[]>;
		connectGetMaxVcpus(type?: string): Promise<number>;
		connectGetHostname(): Promise<string>;

		domainCreateXML(xml: string): Promise<Domain>;
		domainDefineXML(xml: string): Promise<Domain>;
		domainGetInfo(domain: Domain): Promise<DomainInfo>;
		domainGetID(domain: Domain): Promise<number | null>;
		domainGetName(domain: Domain): Promise<string>;
		domainGetUUIDString(domain: Domain): Promise<string>;
		domainLookupByID(id: number): Promise<Domain>;
		domainLookupByName(name: string): Promise<Domain>;
		domainLookupByUUIDString(uuid: string): Promise<Domain>;
		domainSave(domain: Domain, filename: string): Promise<void>;
		domainRestore(filename: string): Promise<void>;
		domainCreate(domain: Domain): Promise<void>;
		domainShutdown(domain: Domain): Promise<void>;
		domainGetXMLDesc(domain: Domain, flags?: DomainGetXMLDescFlags): Promise<string>;

		nodeGetInfo(): Promise<NodeInfo>;
	}
}
