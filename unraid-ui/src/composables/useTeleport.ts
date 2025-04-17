import { onMounted, ref } from 'vue';

const useTeleport = () => {
  const teleportTarget = ref<string | HTMLElement>('#modals');

  const determineTeleportTarget = () => {
    const myModalsComponent =
      document.querySelector('unraid-modals') || document.querySelector('uui-modals');
    if (!myModalsComponent?.shadowRoot) return;

    const potentialTarget = myModalsComponent.shadowRoot.querySelector('#modals');
    if (!potentialTarget) return;

    teleportTarget.value = potentialTarget as HTMLElement;
  };

  onMounted(() => {
    determineTeleportTarget();
  });

  return {
    teleportTarget,
    determineTeleportTarget,
  };
};

export default useTeleport;
