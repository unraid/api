export declare interface HypervisorOptions {
    uri: string;
}

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

export declare const enum ConnectListAllDomainsFlags {
    ACTIVE         = 1,
    INACTIVE       = 2,
    PERSISTENT     = 4,
    TRANSIENT      = 8,
    RUNNING        = 16,
    PAUSED         = 32,
    SHUTOFF        = 64,
    OTHER          = 128,
    MANAGEDSAVE    = 256,
    NO_MANAGEDSAVE = 512,
    AUTOSTART      = 1024,
    NO_AUTOSTART   = 2048,
    HAS_SNAPSHOT   = 4096,
    NO_SNAPSHOT    = 8192,
    HAS_CHECKPOINT = 16384,
    NO_CHECKPOINT  = 32768,
}

export declare const enum DomainGetXMLDescFlags {
    SECURE     = 1,
    INACTIVE   = 2,
    UPDATE_CPU = 4,
    MIGRATABLE = 8,
}

export declare class Domain {}

// https://libvirt.org/manpages/virsh.html#list
export declare const enum DomainState {
    NOSTATE     = 0,
    RUNNING     = 1,
	// Docs are wrong this is not IDLE this is BLOCKED
	// libvirt-domain.h can prove this
    BLOCKED     = 2,
    PAUSED      = 3,
    SHUTDOWN    = 4,
    SHUTOFF     = 5,
    CRASHED     = 6,
    PMSUSPENDED = 7,
}

export declare interface DomainInfo {
    state: DomainState;
    maxMem: number;
    memory: number;
    nrVirtCpu: number;
    cpuTime: number;
}

export declare interface NodeInfo {
    model: string;
    memory: number;
    cpus: number;
    mhz: number;
    nodes: number;
    sockets: number;
    cores: number;
    threads: number;
}
