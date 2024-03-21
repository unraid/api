<script lang="ts" setup>
import { WAN_ACCESS_TYPE, WAN_FORWARD_TYPE } from "~/composables/gql/graphql";
import { useUnraidApiSettingsStore } from "~/store/unraidApiSettings";

const apiSettingsStore = useUnraidApiSettingsStore();

const accessType = ref<WAN_ACCESS_TYPE>(WAN_ACCESS_TYPE.Disabled);
const forwardType = ref<WAN_FORWARD_TYPE | null>(null);
const port = ref<number | null>(null);

const setRemoteAccess = () => {
    apiSettingsStore.setupRemoteAccess({
        accessType: accessType.value,
        ...(forwardType ? { forwardType: forwardType.value } : {}),
        ...(port ? { port: port.value }: {})
    })
}
</script>

<template>
    <div class="flex flex-col">
        <select v-model="accessType">
        </select>
    </div>

</template>