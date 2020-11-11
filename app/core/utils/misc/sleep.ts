/*!
 * Copyright 2019-2020 Lime Technology Inc. All rights reserved.
 * Written by: Alexis Tyler
 */

/**
* Sleep for a certain amount of milliseconds.
* @param ms How many milliseconds to sleep for.
*/
export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
