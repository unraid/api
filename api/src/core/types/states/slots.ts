export type Slot = {
	/** The internal slot number for the pool. */
	idx: string;
	name: string;
	device: string;
	size?: number;
	/** Is the disk a HDD or SSD. */
	rotational: boolean;
	/** Current physical disk temp. */
	temp: number;
	/** Number of reads the disk has had since it was last reset. */
	numReads: number;
	/** Number of writes the disk has had since it was last reset. */
	numWrites: number;
	/** Number of errors the disk has had since it was last reset. */
	numErrors: number;
	sizeSb: number;
	/** Total size of disk in MB. */
	// @todo: Check in the unit that's used for this
	fsSize: number;
	/** Free space on disk. */
	fsFree: number;
	exportable: boolean;
};

export type Slots = Slot[];
