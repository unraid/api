import { isDarkModeActive } from '@/lib/utils';
import { onMounted, ref } from 'vue';

let virtualModalContainer: HTMLDivElement | null = null;

const ensureVirtualContainer = () => {
  if (!virtualModalContainer) {
    virtualModalContainer = document.createElement('div');
    virtualModalContainer.id = 'unraid-api-modals-virtual';
    virtualModalContainer.className = 'unapi';
    virtualModalContainer.style.position = 'relative';
    virtualModalContainer.style.zIndex = '999999';
    if (isDarkModeActive()) {
      virtualModalContainer.classList.add('dark');
    }
    document.body.appendChild(virtualModalContainer);
  }
  return virtualModalContainer;
};

const useTeleport = () => {
  const teleportTarget = ref<string>('#unraid-api-modals-virtual');

  onMounted(() => {
    ensureVirtualContainer();
  });

  return {
    teleportTarget,
  };
};

export default useTeleport;
