import { ensureTeleportContainer } from '@/helpers/ensure-teleport-container';
import { onMounted, ref } from 'vue';

const useTeleport = () => {
  const teleportTarget = ref<string | HTMLElement>('body');

  onMounted(() => {
    const container = ensureTeleportContainer();
    teleportTarget.value = container;
  });

  return {
    teleportTarget,
  };
};

export default useTeleport;
