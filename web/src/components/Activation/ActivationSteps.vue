<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';

const props = withDefaults(
  defineProps<{
    activeStep?: number;
    showActivationStep?: boolean;
  }>(),
  {
    activeStep: 1,
    showActivationStep: true,
  }
);

interface StepItem {
  title: string;
  description: string;
  icon?: string;
}

const allSteps: StepItem[] = [
  {
    title: 'Create Device Password',
    description: 'Secure your device',
    icon: 'i-heroicons-lock-closed',
  },
  {
    title: 'Set Time Zone',
    description: 'Configure system time',
    icon: 'i-heroicons-clock',
  },
  {
    title: 'Install Essential Plugins',
    description: 'Add helpful plugins',
    icon: 'i-heroicons-puzzle-piece',
  },
  {
    title: 'Activate License',
    description: 'Create an Unraid.net account and activate your key',
    icon: 'i-heroicons-key',
  },
  {
    title: 'Unleash Your Hardware',
    description: 'Device is ready to configure',
    icon: 'i-heroicons-server-stack',
  },
];

const steps = computed(() => {
  if (props.showActivationStep) {
    return allSteps;
  }
  return allSteps.filter((_, index) => index !== 3);
});

const currentStepIndex = computed(() => props.activeStep - 1);

const isMobile = ref(false);

const checkScreenSize = () => {
  isMobile.value = window.innerWidth < 768;
};

onMounted(() => {
  checkScreenSize();
  window.addEventListener('resize', checkScreenSize);
});

onUnmounted(() => {
  window.removeEventListener('resize', checkScreenSize);
});

const orientation = computed(() => (isMobile.value ? 'vertical' : 'horizontal'));
</script>

<template>
  <div class="mx-auto w-full max-w-4xl px-4">
    <UStepper :model-value="currentStepIndex" :items="steps" :orientation="orientation" class="w-full" />
  </div>
</template>
