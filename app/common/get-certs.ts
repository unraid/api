import { pki } from 'node-forge';
import { paths } from '../core/paths';
import { varState } from '../core/states/var';
import { attemptReadFileSync } from '../core/utils/misc/attempt-read-file-sync';

const getCertSubject = (path?: string) => {
	try {
		if (!path) return undefined;
		const cert = attemptReadFileSync(path);
		return pki.certificateFromPem(cert)?.subject?.attributes?.[0]?.value as string;
	} catch {
		return '';
	}
};

export const getCerts = () => {
	// Get server's hostname (in lowercase)
	const serverName = varState.data.name.toLowerCase();

	return {
		nonWildcard: getCertSubject(paths.get('non-wildcard-ssl-certificate')),
		wildcard: getCertSubject(paths.get('wildcard-ssl-certificate')),
		userProvided: getCertSubject(`${paths.get('ssl-certificate-directory')!}${serverName}_unraid_bundle.pem`)
	};
};
