import { onMounted, ref } from 'vue';

const useTeleport = () => {
  const teleportTarget = ref<string | HTMLElement>('body');

  onMounted(() => {
    // Look for existing teleport container
    let container = document.getElementById('unraid-teleport-container');

    // If it doesn't exist, create it
    if (!container) {
      container = document.createElement('div');
      container.id = 'unraid-teleport-container';
      container.style.position = 'relative';
      container.classList.add('unapi');
      container.style.zIndex = '999999'; // Very high z-index to ensure it's always on top
      document.body.appendChild(container);
    }

    teleportTarget.value = container;
  });

  return {
    teleportTarget,
  };
};

export default useTeleport;
