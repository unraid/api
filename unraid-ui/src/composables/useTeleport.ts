import { computed } from 'vue';

const useTeleport = () => {
  // Computed property that finds the correct teleport target
  const teleportTarget = computed(() => {
    // #modals should be unique (id), but let's be defensive
    const modalsElement = document.getElementById('modals');
    if (modalsElement) return `#modals`;

    // Find only mounted unraid-modals components (data-vue-mounted="true")
    // This ensures we don't target unmounted or duplicate elements
    const mountedModals = document.querySelector('unraid-modals[data-vue-mounted="true"]');
    if (mountedModals) {
      // Check if it has the inner #modals div
      const innerModals = mountedModals.querySelector('#modals');
      if (innerModals && innerModals.id) {
        return `#${innerModals.id}`;
      }
      // Use the mounted component itself as fallback
      // Add a unique identifier if it doesn't have one
      if (!mountedModals.id) {
        mountedModals.id = 'unraid-modals-teleport-target';
      }
      return `#${mountedModals.id}`;
    }

    // Final fallback to body - modals component not mounted yet
    return 'body';
  });

  return {
    teleportTarget,
  };
};

export default useTeleport;
