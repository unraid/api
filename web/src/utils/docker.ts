import type { DockerContainer } from '@/composables/gql/graphql';
import type { TreeRow } from '@/composables/useTreeData';

const COMMA_SEPARATED_LIST = /\s*,\s*/;
const URL_WITH_PROTOCOL = /^[a-zA-Z][a-zA-Z0-9+\-.]*:\/\//;

export function normalizeListString(value: string): string[] {
  return value
    .split(COMMA_SEPARATED_LIST)
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function formatExternalPorts(container?: DockerContainer | null): string[] {
  if (!container) return [];
  const lanPorts = container.lanIpPorts;
  if (Array.isArray(lanPorts)) {
    return lanPorts
      .map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry).trim()))
      .filter((entry) => entry.length > 0);
  }
  if (!container.ports?.length) return [];
  return container.ports
    .filter(
      (port): port is NonNullable<(typeof container.ports)[number]> =>
        Boolean(port?.publicPort) && Boolean(port?.privatePort)
    )
    .map((port) => `${port.publicPort}:${port.privatePort}/${port.type}`)
    .filter((entry) => entry.length > 0);
}

export function getFirstLanIp(container?: DockerContainer | null): string | null {
  if (!container?.lanIpPorts?.length) return null;
  for (const entry of container.lanIpPorts) {
    if (typeof entry !== 'string') continue;
    const trimmed = entry.trim();
    if (trimmed) return trimmed;
  }
  return null;
}

export function openLanIpInNewTab(address: string) {
  if (typeof window === 'undefined') return;
  const trimmed = address.trim();
  if (!trimmed) return;
  const hasProtocol = URL_WITH_PROTOCOL.test(trimmed);
  const protocol = 'http:';
  const targetUrl = hasProtocol ? trimmed : `${protocol}//${trimmed}`;
  window.open(targetUrl, '_blank', 'noopener');
}

export function formatInternalPorts(container?: DockerContainer | null): string[] {
  if (!container?.ports?.length) return [];
  return container.ports
    .filter((port): port is NonNullable<(typeof container.ports)[number]> => Boolean(port?.privatePort))
    .map((port) => `${port.privatePort}/${port.type}`);
}

export function formatImage(container?: DockerContainer | null): string {
  if (!container?.image) return '';
  const parts = container.image.split(':');
  return parts.length > 1 ? parts[parts.length - 1] : 'latest';
}

export function formatNetwork(container?: DockerContainer | null): string {
  if (!container) return '';
  return container.hostConfig?.networkMode || '';
}

export function formatContainerIp(container?: DockerContainer | null): string[] {
  if (!container?.networkSettings) return [];
  try {
    const settings = container.networkSettings as Record<string, unknown>;
    if (settings.Networks && typeof settings.Networks === 'object') {
      const networks = Object.values(settings.Networks as Record<string, unknown>);
      const ips = networks
        .map((net) => (net as Record<string, unknown>).IPAddress)
        .filter((value): value is string => typeof value === 'string' && value.length > 0);
      if (ips.length) {
        return ips;
      }
    }
    if (settings.IPAddress && typeof settings.IPAddress === 'string') {
      return settings.IPAddress.length ? [settings.IPAddress] : [];
    }
  } catch (e) {
    return [];
  }
  return [];
}

export function formatVolumes(container?: DockerContainer | null): string {
  if (!container?.mounts) return '';
  try {
    const mounts = container.mounts as unknown[];
    return mounts
      .map((mount) => {
        const m = mount as Record<string, unknown>;
        if (m.Type === 'bind' && m.Source && m.Destination) {
          return `${m.Source} → ${m.Destination}`;
        }
        if (m.Type === 'volume' && m.Name && m.Destination) {
          return `${m.Name} → ${m.Destination}`;
        }
        return '';
      })
      .filter(Boolean)
      .join(', ');
  } catch (e) {
    return '';
  }
}

export function formatUptime(container?: DockerContainer | null): string {
  if (!container?.status) return '';
  const match = container.status.match(/Up\s+(.+?)(?:\s+\(|$)/i);
  return match ? match[1] : '';
}

export function normalizeMultiValue(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((entry) => (typeof entry === 'string' ? entry.trim() : String(entry)))
      .filter((entry) => entry.length > 0);
  }
  if (typeof value === 'string') {
    return normalizeListString(value);
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return [String(value)];
  }
  return [];
}

export function toContainerTreeRow(
  meta: DockerContainer | null | undefined,
  fallbackName?: string
): TreeRow<DockerContainer> {
  const name = meta?.names?.[0]?.replace(/^\//, '') || fallbackName || 'Unknown';
  const updatesParts: string[] = [];
  if (meta?.isUpdateAvailable) updatesParts.push('Update');
  if (meta?.isRebuildReady) updatesParts.push('Rebuild');
  return {
    id: meta?.id || name,
    type: 'container',
    name,
    state: meta?.state ?? '',
    version: formatImage(meta || undefined),
    network: formatNetwork(meta || undefined),
    containerIp: formatContainerIp(meta || undefined),
    containerPort: formatInternalPorts(meta || undefined),
    lanPort: formatExternalPorts(meta || undefined),
    volumes: formatVolumes(meta || undefined),
    autoStart: meta?.autoStart ? 'On' : 'Off',
    updates: updatesParts.join(' / ') || '—',
    uptime: formatUptime(meta || undefined),
    containerId: meta?.id,
    icon: meta?.iconUrl || undefined,
    meta: meta || undefined,
  };
}
