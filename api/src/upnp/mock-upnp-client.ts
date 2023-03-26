import { type Mapping, type Client, type NewPortMappingOpts, type StandardOpts } from '@runonflux/nat-upnp';

export class MockUpnpClient implements Partial<Client> {
	timeout: number;
	mappings: Mapping[];
	constructor({ timeout }: { timeout: number }) {
		this.timeout = timeout;
		this.mappings = [];
	}

	public async createMapping(mapping: NewPortMappingOpts) {
		if (typeof mapping.public !== 'number' || typeof mapping.private !== 'number') {
			throw new Error('Invalid Mapping');
		}

		this.mappings.push({ public: { port: mapping.public, host: 'DOCKER' }, private: { port: mapping.private, host: 'DOCKER' }, enabled: true, local: false, protocol: mapping.protocol ?? 'n/a', description: mapping.description ?? 'n/a', ttl: mapping.ttl ?? 0 });
		return {
			test: {
				enabled: true,
				'@': {
					'xmlns:u': 'true',
				},
			},
		};
	}

	public async getMappings() {
		return this.mappings;
	}

	public async removeMapping(options: StandardOpts): Promise<Partial<Record<string, { [key: string]: unknown; '@': { 'xmlns:u': string } }>>> {
		if (typeof options.public !== 'number') {
			throw new Error('Public must be a number');
		}

		const index = this.mappings.findIndex(mapping => mapping.public.port === options.public);
		this.mappings.splice(index, 1);
		return {
			test: {
				enabled: true,
				'@': {
					'xmlns:u': 'true',
				},
			},
		};
	}
}
