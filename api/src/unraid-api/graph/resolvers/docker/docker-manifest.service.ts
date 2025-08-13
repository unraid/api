import { Injectable, Logger } from '@nestjs/common';

import { ExtendOptions, Got, got as gotClient, OptionsOfTextResponseBody } from 'got';

import { docker } from '@app/core/utils/index.js';
import { DockerAuthService } from '@app/unraid-api/graph/resolvers/docker/docker-auth.service.js';

/** Accept header for Docker API manifest listing */
const ACCEPT_MANIFEST =
    'application/vnd.docker.distribution.manifest.list.v2+json,application/vnd.docker.distribution.manifest.v2+json,application/vnd.oci.image.index.v1+json';

@Injectable()
export class DockerManifestService {
    private readonly logger = new Logger(DockerManifestService.name);
    constructor(private readonly dockerAuthService: DockerAuthService) {}

    parseImageRef(imageRef: string) {
        // Normalize to repo:tag and extract registry/repo/name/tag
        let ref = imageRef;
        if (!ref.includes(':')) ref += ':latest';

        // Registry present?
        const firstSlash = ref.indexOf('/');
        const maybeRegistry = firstSlash > -1 ? ref.slice(0, firstSlash) : '';
        const hasDotOrColon = maybeRegistry.includes('.') || maybeRegistry.includes(':');
        const isDockerHub = !hasDotOrColon || maybeRegistry === 'docker.io';

        const registry = isDockerHub ? 'registry-1.docker.io' : maybeRegistry;
        const rest = isDockerHub ? ref : ref.slice(maybeRegistry.length + 1);

        const lastColon = rest.lastIndexOf(':');
        const namePart = rest.slice(0, lastColon);
        const tag = rest.slice(lastColon + 1);

        // Ensure docker hub library namespace
        const repoPath = isDockerHub && !namePart.includes('/') ? `library/${namePart}` : namePart;

        return {
            registryBaseURL: `https://${registry}`,
            authConfigKey: isDockerHub ? 'https://index.docker.io/v1/' : maybeRegistry,
            repoPath, // e.g. library/nginx or org/image
            tag,
        };
    }

    async headManifest(
        url: string,
        headers: Record<string, string>,
        authHeader: Record<string, string> = {},
        got: Got<ExtendOptions> = gotClient
    ) {
        const opts: OptionsOfTextResponseBody = {
            headers: { ...headers, ...authHeader },
            timeout: { request: 15_000 },
            throwHttpErrors: false,
        };
        try {
            return await got.head(url, opts);
        } catch {
            // Some registries don’t allow HEAD; try GET to read headers
            return await got.get(url, opts);
        }
    }

    async getRemoteDigest(imageRef) {
        const { registryBaseURL, repoPath, tag, authConfigKey } = this.parseImageRef(imageRef);
        const manifestURL = `${registryBaseURL}/v2/${repoPath}/manifests/${tag}`;

        const dockerAuths = this.dockerAuthService.readDockerAuth();
        const authEntry = dockerAuths[authConfigKey];
        const basicCreds = authEntry?.auth
            ? this.dockerAuthService.decodeAuth(authEntry.auth)
            : { username: '', password: '' };

        // 1) Probe without auth to learn challenge
        let resp = await this.headManifest(manifestURL, { Accept: ACCEPT_MANIFEST });
        const digestHeaderRaw = resp.headers?.['docker-content-digest'];
        const digestHeader = Array.isArray(digestHeaderRaw) ? digestHeaderRaw[0] : digestHeaderRaw;
        if (resp.statusCode >= 200 && resp.statusCode < 300 && digestHeader) return digestHeader.trim();

        const wwwAuth = (resp.headers?.['www-authenticate'] || '').toString();
        if (/Bearer/i.test(wwwAuth)) {
            const token = await this.dockerAuthService.getBearerToken(wwwAuth, basicCreds);
            if (!token) return null;
            // 2) Repeat with Bearer
            resp = await this.headManifest(
                manifestURL,
                { Accept: ACCEPT_MANIFEST },
                { Authorization: `Bearer ${token}` }
            );
        } else if (/Basic/i.test(wwwAuth) && basicCreds.username && basicCreds.password) {
            // 2) Repeat with Basic
            const basic =
                'Basic ' +
                Buffer.from(`${basicCreds.username}:${basicCreds.password}`).toString('base64');
            resp = await this.headManifest(
                manifestURL,
                { Accept: ACCEPT_MANIFEST },
                { Authorization: basic }
            );
        }

        const digestRaw = resp.headers?.['docker-content-digest'];
        const digest = Array.isArray(digestRaw) ? digestRaw[0] : digestRaw;
        return digest ? digest.trim() : null;
    }

    async getLocalDigest(imageRef: string) {
        try {
            const data = await docker.getImage(imageRef).inspect();
            const digests = data.RepoDigests || [];
            if (digests.length === 0) return null;
            // Prefer a digest matching this repo if present; else first
            const pick = digests.find((d) => d.startsWith(imageRef.split(':')[0] + '@')) || digests[0];
            const [, shaDigestString] = pick.split('@');
            return shaDigestString ?? null;
        } catch {
            return null;
        }
    }

    async isRebuildReady(networkMode?: string) {
        if (!networkMode || !networkMode.startsWith('container:')) return false;
        const target = networkMode.slice('container:'.length);
        try {
            await docker.getContainer(target).inspect();
            return false;
        } catch {
            return true; // unresolved target -> ':???' equivalent
        }
    }

    async isUpdateAvailable(imageRef: string) {
        const [local, remote] = await Promise.all([
            this.getLocalDigest(imageRef),
            this.getRemoteDigest(imageRef),
        ]);
        if (local && remote) return local !== remote;
        return null; // unknown
    }
}
