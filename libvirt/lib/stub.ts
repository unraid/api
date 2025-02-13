export class Connect {
	connect(): void {
		throw new Error('Libvirt bindings are not available on this platform');
	}

	close(): void {
		throw new Error('Libvirt bindings are not available on this platform');
	}
}

export class Domain {
	start(): void {
		throw new Error('Libvirt bindings are not available on this platform');
	}

	shutdown(): void {
		throw new Error('Libvirt bindings are not available on this platform');
	}
}

// Add other stub methods that match your actual API
