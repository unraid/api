/**
 * Ensures the teleport container exists in the DOM.
 * This is used by both the standalone mount script and unraid-ui components
 * to ensure modals and other teleported content have a target.
 */
export function ensureTeleportContainer(): HTMLElement {
  const containerId = 'unraid-teleport-container';

  // Check if container already exists
  let container = document.getElementById(containerId);

  // If it doesn't exist, create it
  if (!container) {
    container = document.createElement('div');
    container.id = containerId;
    container.style.position = 'relative';
    container.classList.add('unapi');
    container.style.zIndex = '999999'; // Very high z-index to ensure it's always on top
    document.body.appendChild(container);
  }

  return container;
}
