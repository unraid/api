<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useUpdateOsChangelogStore } from '~/store/updateOsChangelog';

const changelog = ref('');
const changelogPretty = ref('');
const updateOsChangelogStore = useUpdateOsChangelogStore();
const { releaseForUpdate: updateOsChangelogModalVisible } = storeToRefs(updateOsChangelogStore);
onMounted(async () => {
    const response = await fetch('https://releases.unraid.net/json');
    const data = await response.json();
    console.debug('[changelog] data', data);
    if (data.length > 0) {
        changelog.value = data[0].changelog;
        changelogPretty.value = data[0].changelog_pretty;
    }
});

function showChangelogModal() {
    // Simulate receiving a release for update
    updateOsChangelogStore.setReleaseForUpdate({
        version: '6.12.3',
        date: '2023-07-15',
        changelog: changelog.value,
        changelogPretty: changelogPretty.value,
        name: '6.12.3',
        isEligible: true,
        isNewer: true,  
        sha256: '1234567890'
    });
}

function showChangelogWithoutPretty() {
    // Simulate receiving a release without the pretty version
    updateOsChangelogStore.setReleaseForUpdate({
        version: '6.12.3',
        date: '2023-07-15',
        changelog: changelog.value,
        changelogPretty: '',
        name: '6.12.3',
        isEligible: true,
        isNewer: true,  
        sha256: '1234567890'
    });
}

function showChangelogBrokenParse() {
    updateOsChangelogStore.setReleaseForUpdate({
        version: '6.12.3',
        date: '2023-07-15',
        changelog: null,
        changelogPretty: undefined, // intentionally broken
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
        <div class="mb-6 flex gap-4">
            <button 
                class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
                @click="showChangelogModal"
            >
                Test Changelog Modal
            </button>
            <button 
                class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600" 
                @click="showChangelogWithoutPretty"
            >
                Test Without Pretty Changelog
            </button>
            <button 
                class="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600" 
                @click="showChangelogBrokenParse"
            >
                Test Broken Parse Changelog
            </button>
        </div>
        
        <div class="prose max-w-none">
            <div v-html="changelog"></div>
        </div>
    </div>
</template>
