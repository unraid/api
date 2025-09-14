/**
 * Lazily ensures the teleport container exists in the DOM.
 * Container is only created when first requested by a component that needs it.
 * This keeps it out of the critical rendering path.
 */
let cachedContainer: HTMLElement | null = null;

export function ensureTeleportContainer(): HTMLElement {
  // Return cached container if it exists and is still in DOM
  if (cachedContainer && document.body.contains(cachedContainer)) {
    return cachedContainer;
  }

  const containerId = 'unraid-teleport-container';

  // Check if container already exists in DOM
  let container = document.getElementById(containerId);

  // Only create if it doesn't exist and a component actually needs it
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'relative';
    container.classList.add('unapi');
    container.style.zIndex = '999999'; // Very high z-index to ensure it's always on top

    // Use requestIdleCallback if available to append during idle time
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        if (!document.getElementById(containerId)) {
          document.body.appendChild(container!);
        }
      });
    } else {
      document.body.appendChild(container);
    }
  }

  cachedContainer = container;
  return container;
}
