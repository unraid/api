import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

export function makeCertificate(directory: string, domain = '*.example.myunraid.net') {
    const path = join(directory, 'bundle.pem');
    execFileSync(
        'openssl',
        [
            'req',
            '-x509',
            '-newkey',
            'ec',
            '-pkeyopt',
            'ec_paramgen_curve:P-256',
            '-nodes',
            '-keyout',
            join(directory, 'key.pem'),
            '-out',
            path,
            '-days',
            '1',
            '-subj',
            `/CN=${domain}`,
        ],
        { stdio: 'ignore' }
    );
    return path;
}
