import { onMounted, ref } from 'vue';

let virtualModalContainer: HTMLDivElement | null = null;

const ensureVirtualContainer = () => {
  if (!virtualModalContainer) {
    virtualModalContainer = document.createElement('div');
    virtualModalContainer.id = 'unraid-api-modals-virtual';
    virtualModalContainer.className = 'unapi';
    virtualModalContainer.style.position = 'relative';
    virtualModalContainer.style.zIndex = '999999';
    document.body.appendChild(virtualModalContainer);
  }
  return virtualModalContainer;
};

const useTeleport = () => {
  const teleportTarget = ref<string>('#unraid-api-modals-virtual');

  onMounted(() => {
    const existingModals = document.getElementById('modals');
    if (existingModals) {
      teleportTarget.value = '#modals';
    } else {
      ensureVirtualContainer();
    }
  });

  return {
    teleportTarget,
  };
};

export default useTeleport;
