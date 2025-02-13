import {
	Hypervisor,
	Domain,
	ConnectListAllDomainsFlags,
	DomainGetXMLDescFlags,
	DomainState
} from './bindings';

// Contains actual libvirt bindings and related declarations.
export {
	Hypervisor,
	Domain,
	ConnectListAllDomainsFlags,
	DomainGetXMLDescFlags,
	DomainState
};

// Contains interfaces to describe domains, networks, etc.
export * from './domain-desc';
// Contains helper functions to serialize domain descriptions to XML.
export * from './domain-xml';
// Contains a builder class to construct domain descriptions.
export * from './domain-builder';
