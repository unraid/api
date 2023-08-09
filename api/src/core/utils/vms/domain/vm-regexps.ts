/**
 * Disallowed device ids.
*/
const disallowedClassId = /^(05|06|08|0a|0b|0c05)/;

/**
 * Allowed audio device ids.
 */
const allowedAudioClassId = /^(0403)/;

/**
 * Allowed GPU device ids.
 */
const allowedGpuClassId = /^(0001|03)/;

/**
 * VM RegExps.
 * @note Class IDs come from the bottom of /usr/share/hwdata/pci.ids
 */
export const vmRegExps = {
	disallowedClassId,
	allowedAudioClassId,
	allowedGpuClassId,
};
