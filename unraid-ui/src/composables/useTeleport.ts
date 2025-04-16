import { onMounted, ref } from 'vue';

const useTeleport = () => {
  const teleportTarget = ref<string | HTMLElement>('#modals');

  const determineTeleportTarget = () => {
    const myModalsComponent = document.querySelector('unraid-modals') || document.querySelector('uui-modals');
    console.log('myModalsComponent', myModalsComponent, 'has shadowRoot', myModalsComponent?.shadowRoot);
    if (!myModalsComponent?.shadowRoot) return;

    const potentialTarget = myModalsComponent.shadowRoot.querySelector('#modals');
    if (!potentialTarget) return;

    console.log('potentialTarget', potentialTarget);

    teleportTarget.value = potentialTarget as HTMLElement;
    console.log('[determineTeleportTarget] teleportTarget', teleportTarget.value);
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
