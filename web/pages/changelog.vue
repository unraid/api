<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUpdateOsChangelogStore } from '~/store/updateOsChangelog';

const changelog = ref('');
const updateOsChangelogStore = useUpdateOsChangelogStore();
const { releaseForUpdate: updateOsChangelogModalVisible } = storeToRefs(updateOsChangelogStore);
onMounted(async () => {
    const response = await fetch('https://releases.unraid.net/json');
    const data = await response.json();
    if (data.length > 0) {
        changelog.value = data[0].changelog;
    }
});

function showChangelogModal() {
    // Simulate receiving a release for update
    updateOsChangelogStore.setReleaseForUpdate({
        version: '6.12.3',
        date: '2023-07-15',
        changelog: changelog.value,
        name: '6.12.3',
        isEligible: true,
        isNewer: true,
        sha256: '1234567890'
    });
}
const { t } = useI18n();

</script>

<template>
    <div class="container mx-auto p-6">
        <h1 class="text-2xl font-bold mb-6">Changelog</h1>
        <UpdateOsChangelogModal :t="t" :open="!!updateOsChangelogModalVisible" />
        <div class="mb-6">
            <button 
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
                @click="showChangelogModal"
            >
                Test Changelog Modal
            </button>
        </div>
        
        <div class="prose max-w-none">
            <div v-html="changelog"></div>
        </div>
    </div>
</template>
