import { ref, onMounted } from "vue";

const useTeleport = () => {
  const teleportTarget = ref<string | HTMLElement | Element>("#modals");

  const determineTeleportTarget = () => {
    const myModalsComponent = document.querySelector("unraid-modals");
    if (!myModalsComponent?.shadowRoot) return;

    const potentialTarget = myModalsComponent.shadowRoot.querySelector("#modals");
    if (!potentialTarget) return;

    teleportTarget.value = potentialTarget;
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
