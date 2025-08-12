import { Injectable, Logger } from '@nestjs/common';
import { readFile } from 'fs/promises';
import { join } from 'path';

import type { Got } from 'got';
import { ExtendOptions, got as gotClient } from 'got';

export type BasicDockerCreds = {
    username: string;
    password: string;
};

export type DockerWwwAuthParts = {
    realm: string;
    service: string;
    scope: string;
};

@Injectable()
export class DockerAuthService {
    private readonly logger = new Logger(DockerAuthService.name);
    constructor() {}

    async readDockerAuth(configPath?: string) {
        try {
            configPath ??= join(process.env.HOME || '/root', '.docker/config.json');
            const cfg = JSON.parse(await readFile(configPath, 'utf8'));
            return cfg.auths || {};
        } catch (error) {
            this.logger.debug(error, `Failed to read Docker auth from '${configPath}'`);
            return {};
        }
    }

    decodeAuth(auth: string): BasicDockerCreds {
        try {
            const [username, password] = Buffer.from(auth, 'base64').toString('utf8').split(':');
            return { username, password };
        } catch {
            return { username: '', password: '' };
        }
    }

    parseWWWAuth(wwwAuth: string): Partial<DockerWwwAuthParts> {
        // www-authenticate: Bearer realm="...",service="...",scope="repository:repo/name:pull"
        const parts: Partial<DockerWwwAuthParts> = {};
        const rawParts = wwwAuth.replace(/^Bearer\s+/i, '').split(',') || [];
        rawParts.forEach((pair) => {
            const [k, v] = pair.split('=');
            parts[k.trim()] = v?.replace(/^"|"$/g, '');
        });
        return parts;
    }

    async getBearerToken(
        wwwAuth: string,
        basicCreds: BasicDockerCreds,
        got: Got<ExtendOptions> = gotClient
    ) {
        const parts = this.parseWWWAuth(wwwAuth);
        if (!parts.realm || !parts.service || !parts.scope) return null;
        const { token } = await got
            .get(parts.realm, {
                searchParams: { service: parts.service, scope: parts.scope },
                username: basicCreds.username,
                password: basicCreds.password,
                timeout: { request: 15_000 },
                responseType: 'json',
            })
            .json<{ token?: string }>();
        return token;
    }
}
