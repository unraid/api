export type NfsShare = {
	name: string;
	enabled: boolean;
	writeList: string[];
	readList: string[];
};

export type NfsShares = NfsShare[];
