import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';
import { useQuery } from '@vue/apollo-composable';
import { useSessionStorage } from '@vueuse/core';

import type { ReleaseStepConfig } from '~/components/Activation/releaseConfigs';

import { getUpgradeSteps } from '~/components/Activation/releaseConfigs';
import { UPGRADE_INFO_QUERY } from '~/components/Activation/upgradeInfo.query';

const UPGRADE_ONBOARDING_HIDDEN_KEY = 'upgrade-onboarding-hidden';

export const useUpgradeOnboardingStore = defineStore('upgradeOnboarding', () => {
  const { result: upgradeInfoResult, loading: upgradeInfoLoading } = useQuery(
    UPGRADE_INFO_QUERY,
    {},
    { errorPolicy: 'all' }
  );

  const isHidden = useSessionStorage<boolean>(UPGRADE_ONBOARDING_HIDDEN_KEY, false);

  const isUpgrade = computed(() => upgradeInfoResult.value?.info?.versions?.upgrade?.isUpgrade ?? false);
  const previousVersion = computed(
    () => upgradeInfoResult.value?.info?.versions?.upgrade?.previousVersion
  );
  const currentVersion = computed(
    () => upgradeInfoResult.value?.info?.versions?.upgrade?.currentVersion
  );

  const upgradeSteps = ref<ReleaseStepConfig[]>([]);

  watch(
    [isUpgrade, previousVersion, currentVersion],
    async ([isUpgradeValue, prevVersion, currVersion]) => {
      if (isUpgradeValue && prevVersion && currVersion) {
        upgradeSteps.value = await getUpgradeSteps(prevVersion, currVersion);
      } else {
        upgradeSteps.value = [];
      }
    },
    { immediate: true }
  );

  const shouldShowUpgradeOnboarding = computed(() => {
    return !isHidden.value && isUpgrade.value && upgradeSteps.value.length > 0;
  });

  const setIsHidden = (value: boolean) => {
    isHidden.value = value;
  };

  return {
    loading: computed(() => upgradeInfoLoading.value),
    isUpgrade,
    previousVersion,
    currentVersion,
    upgradeSteps,
    shouldShowUpgradeOnboarding,
    isHidden,
    setIsHidden,
  };
});
