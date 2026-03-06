<script lang="ts" setup>
import OnboardingPartnerLogoImg from '@/components/Onboarding/components/OnboardingPartnerLogoImg.vue';

interface Props {
  partnerInfo?: {
    partner?: { url?: string | null } | null;
    branding?: {
      partnerLogoLightUrl?: string | null;
      partnerLogoDarkUrl?: string | null;
      hasPartnerLogo?: boolean | null;
    } | null;
  } | null;
}

defineProps<Props>();
</script>

<template>
  <a
    v-if="partnerInfo?.partner?.url"
    :href="partnerInfo?.partner?.url"
    class="opacity-100 hover:opacity-75 focus:opacity-75"
    target="_blank"
    rel="noopener noreferrer"
  >
    <OnboardingPartnerLogoImg :partner-info="partnerInfo" />
  </a>
</template>
