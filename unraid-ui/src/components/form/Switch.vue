<script setup lang="ts">
import { ref } from "vue";
import { Switch, SwitchGroup, SwitchLabel } from "@headlessui/vue";

export interface Props {
  label?: string;
  // propChecked?: boolean;
}

withDefaults(defineProps<Props>(), {
  label: "",
  // propChecked: false,
});

const checked = ref(false);
</script>

<template>
  <SwitchGroup>
    <div class="flex items-center gap-8px p-8px rounded">
      <Switch
        v-model="checked"
        :class="
          checked
            ? 'bg-gradient-to-r from-unraid-red to-orange'
            : 'bg-transparent'
        "
        class="relative inline-flex h-24px w-[48px] items-center rounded-full overflow-hidden"
      >
        <span
          v-show="!checked"
          class="absolute z-0 inset-0 opacity-10 bg-primary"
        />
        <span
          :class="checked ? 'translate-x-[26px]' : 'translate-x-[2px]'"
          class="inline-block h-20px w-20px transform rounded-full bg-white transition"
        />
      </Switch>
      <SwitchLabel>{{ label }}</SwitchLabel>
    </div>
  </SwitchGroup>
</template>
