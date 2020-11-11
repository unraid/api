/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

/**
 * Share
 * @interface Share
 */
export interface Share {
	/** Share name. */
	name: string;
	/** Free space in bytes. */
	free: number;
	/** Total space in bytes. */
	size: number;
	/** Which disks to include from the share. */
	include: string[];
	/** Which disks to exclude from the share. */
	exclude: string[];
	/** If the share should use the cache. */
	cache: boolean;
}

/**
 * Disk share
 */
export interface DiskShare extends Share {
	type: 'disk';
}

/**
 * User share
 */
export interface UserShare extends Share {
	type: 'user';
}

export type ShareType = 'user' | 'users' | 'disk' | 'disks';

// Name,
// type: 'disk',
// size: Number(fsSize),
// free: Number(fsFree),
// smb,
// nfs,
