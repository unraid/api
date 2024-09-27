<script setup lang="ts">
const visible = ref<boolean>(false);
</script>

<template>
  <div class="card flex justify-center">
    <Drawer v-model:visible="visible" header="Drawers" position="right" class="!w-full md:!w-80 lg:!w-[30rem]">
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</p>
    </Drawer>
    <Button label="Open" class="p-button-rounded p-button-outlined" @click="visible = true" />
  </div>
</template>
