// @todo: finish this
export type DomainState = 'running' | 'stopped';

/**
 * Vm domain.
 */
export interface Domain {
	uuid: string;
	osType: string;
	autostart: string;
	maxMemory: string;
	schedulerType: string;
	schedulerParameters: string;
	securityLabel: string;
	name: string;
	state: string;
	vcpus?: string;
	memoryStats?: string;
}
