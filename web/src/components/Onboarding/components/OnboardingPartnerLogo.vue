<script lang="ts" setup>
import OnboardingPartnerLogoImg from '@/components/Onboarding/components/OnboardingPartnerLogoImg.vue';

interface Props {
  partnerInfo?: {
    partnerUrl?: string | null;
    partnerLogoUrl?: string | null;
    hasPartnerLogo?: boolean;
  };
}

defineProps<Props>();
</script>

<template>
  <template v-if="partnerInfo?.partnerUrl">
    <a
      v-if="partnerInfo?.partnerUrl"
      :href="partnerInfo?.partnerUrl"
      class="opacity-100 hover:opacity-75 focus:opacity-75"
      target="_blank"
      rel="noopener noreferrer"
    >
      <OnboardingPartnerLogoImg :partner-info="partnerInfo" />
    </a>
    <OnboardingPartnerLogoImg v-else :partner-info="partnerInfo" />
  </template>
</template>
