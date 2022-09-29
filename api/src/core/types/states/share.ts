/*!
 * Copyright 2019-2022 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

export type Share = {
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
};

export type Shares = Share[];

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
