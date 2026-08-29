export function controlPlaneOrigin(base: string | undefined): string {
    if (!base) throw new Error('Connect control plane is not configured');
    const url = new URL(base);
    if (url.username || url.password || url.search || url.hash || url.pathname !== '/') {
        throw new Error('Connect control plane must be an origin');
    }
    if (
        url.protocol !== 'https:' &&
        !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))
    )
        throw new Error('Connect requires HTTPS');
    return url.origin;
}

export function validHostname(value: unknown): value is string {
    return (
        typeof value === 'string' &&
        /^(?:tun|srv)-[a-f0-9]{32}\.[a-z0-9-]+\.(?:preview\.)?myunraid\.net$/.test(value)
    );
}

export async function requestControlPlane(
    base: string,
    key: string,
    path: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    requestBody: object = {}
) {
    if (!key) throw new Error('Sign in to Unraid Connect first');
    let response: Response;
    try {
        response = await fetch(new URL(path, controlPlaneOrigin(base)), {
            method,
            headers: { 'x-api-key': key, 'Content-Type': 'application/json' },
            ...(method === 'GET' ? {} : { body: JSON.stringify(requestBody) }),
            redirect: 'error',
            signal: AbortSignal.timeout(15_000),
        });
    } catch {
        throw new Error('Connect request failed');
    }
    if (path === '/tunnel/disable' && response.status === 409) return { removed: 0 };
    if (response.status !== 200) throw new ControlPlaneResponseError(response.status);
    const body: unknown = await response.json();
    if (!body || typeof body !== 'object' || Array.isArray(body))
        throw new Error('Invalid Connect response');
    return body;
}

export function webguiHostnames(value: unknown, primary: unknown): string[] {
    if (!Array.isArray(value) || !validHostname(primary)) throw new Error('Invalid tunnel routes');
    const names: string[] = [];
    for (const route of value) {
        if (!route || typeof route !== 'object') throw new Error('Invalid tunnel route');
        if (route.purpose !== 'webgui' || route.enabled !== true) continue;
        if (!validHostname(route.hostname)) throw new Error('Invalid tunnel hostname');
        if (!names.includes(route.hostname)) names.push(route.hostname);
    }
    if (!names.includes(primary)) throw new Error('Primary tunnel hostname is not enabled');
    return names;
}

export class ControlPlaneResponseError extends Error {
    constructor(readonly status: number) {
        super(`Connect request refused (${status})`);
    }
}
