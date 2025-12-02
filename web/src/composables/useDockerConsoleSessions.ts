import { computed, ref } from 'vue';

export interface ConsoleSession {
  containerName: string;
  iframe: HTMLIFrameElement;
  wrapper: HTMLDivElement;
  isPoppedOut: boolean;
  createdAt: number;
}

const sessions = ref<Map<string, ConsoleSession>>(new Map());
let portalContainer: HTMLDivElement | null = null;

function ensurePortalContainer(): HTMLDivElement {
  if (portalContainer && document.body.contains(portalContainer)) {
    return portalContainer;
  }

  portalContainer = document.createElement('div');
  portalContainer.id = 'docker-console-portal';
  // z-index must be higher than modals/slideouts (typically 50-100)
  portalContainer.style.cssText =
    'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 99999;';
  document.body.appendChild(portalContainer);
  return portalContainer;
}

function getSocketPath(containerName: string): string {
  const encodedName = encodeURIComponent(containerName.replace(/ /g, '_'));
  return `/logterminal/${encodedName}/`;
}

function cleanupStaleSessions(): void {
  if (sessions.value.size === 0) return;

  const validSessions = new Map<string, ConsoleSession>();
  for (const [key, session] of sessions.value) {
    if (document.body.contains(session.wrapper)) {
      validSessions.set(key, session);
    }
  }
  sessions.value = validSessions;
}

export function useDockerConsoleSessions() {
  cleanupStaleSessions();

  const activeSessions = computed(() =>
    Array.from(sessions.value.values()).filter((s) => !s.isPoppedOut)
  );

  function hasActiveSession(containerName: string): boolean {
    const session = sessions.value.get(containerName);
    return Boolean(session && !session.isPoppedOut);
  }

  function getSession(containerName: string): ConsoleSession | null {
    return sessions.value.get(containerName) ?? null;
  }

  async function createSession(containerName: string, shell = 'sh'): Promise<ConsoleSession> {
    const existing = sessions.value.get(containerName);
    if (existing && !existing.isPoppedOut) {
      return existing;
    }

    if (existing) {
      existing.wrapper.remove();
    }

    const params = new URLSearchParams({
      tag: 'docker',
      name: containerName,
      more: shell,
    });

    await fetch(`/webGui/include/OpenTerminal.php?${params.toString()}`);
    await new Promise((resolve) => setTimeout(resolve, 300));

    const wrapper = document.createElement('div');
    wrapper.className = 'docker-console-wrapper';
    wrapper.dataset.containerName = containerName;
    wrapper.style.cssText =
      'position: fixed; top: -9999px; left: -9999px; width: 800px; height: 600px; pointer-events: auto;';

    const iframe = document.createElement('iframe');
    iframe.src = getSocketPath(containerName);
    iframe.style.cssText = 'width: 100%; height: 100%; border: none; border-radius: 0.5rem;';

    wrapper.appendChild(iframe);

    const portal = ensurePortalContainer();
    portal.appendChild(wrapper);

    const session: ConsoleSession = {
      containerName,
      iframe,
      wrapper,
      isPoppedOut: false,
      createdAt: Date.now(),
    };

    sessions.value = new Map(sessions.value).set(containerName, session);
    return session;
  }

  function showSession(containerName: string, rect: DOMRect): void {
    const session = sessions.value.get(containerName);
    if (!session || session.isPoppedOut) return;

    session.wrapper.style.cssText = `
      position: fixed;
      top: ${rect.top}px;
      left: ${rect.left}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      pointer-events: auto;
    `;
  }

  function hideSession(containerName: string): void {
    const session = sessions.value.get(containerName);
    if (!session || session.isPoppedOut) return;

    session.wrapper.style.cssText =
      'position: fixed; top: -9999px; left: -9999px; width: 800px; height: 600px; pointer-events: auto;';
  }

  function destroySession(containerName: string): void {
    const session = sessions.value.get(containerName);
    if (session) {
      session.wrapper.remove();
      const newMap = new Map(sessions.value);
      newMap.delete(containerName);
      sessions.value = newMap;
    }
  }

  function markPoppedOut(containerName: string): void {
    const session = sessions.value.get(containerName);
    if (session) {
      session.isPoppedOut = true;
      session.wrapper.remove();
    }
  }

  return {
    sessions,
    activeSessions,
    hasActiveSession,
    getSession,
    createSession,
    showSession,
    hideSession,
    destroySession,
    markPoppedOut,
  };
}
