import { pki } from 'node-forge';
import { paths } from '../core/paths';
import { attemptReadFileSync } from '../core/utils/misc/attempt-read-file-sync';

export const getCerts = () => {
	const nonWildcardCert = attemptReadFileSync(paths.get('non-wildcard-ssl-certificate')!);
	const wildcardCert = attemptReadFileSync(paths.get('wildcard-ssl-certificate')!);
	return {
		nonWildcard: nonWildcardCert ? pki.certificateFromPem(nonWildcardCert)?.subject?.attributes?.[0]?.value as string : undefined,
		wildcard: wildcardCert ? (pki.certificateFromPem(wildcardCert)?.subject?.attributes?.[0]?.value as string).replace('*.', '') : undefined
	};
};
