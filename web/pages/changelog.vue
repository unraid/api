<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useUpdateOsStore } from '~/store/updateOs';
import { storeToRefs } from 'pinia';

const updateOsStore = useUpdateOsStore();
const { changelogModalVisible } = storeToRefs(updateOsStore);
const { t } = useI18n();

onBeforeMount(() => {
  // Register custom elements if needed for ColorSwitcherCe
});

async function showChangelogModalFromReleasesEndpoint() {
    const response = await fetch('https://releases.unraid.net/os?branch=stable&current_version=6.12.3');
    const data = await response.json();
    updateOsStore.setReleaseForUpdate(data);
}

function showChangelogModalWithTestData() {
    updateOsStore.setReleaseForUpdate({
        version: '6.12.3',
        date: '2023-07-15',
        changelog: 'https://raw.githubusercontent.com/unraid/docs/main/docs/unraid-os/release-notes/6.12.3.md',
        changelogPretty: 'https://docs.unraid.net/go/release-notes/6.12.3',
        name: '6.12.3',
        isEligible: true,
        isNewer: true,  
        sha256: '1234567890'
    });
}

function showChangelogWithoutPretty() {
    updateOsStore.setReleaseForUpdate({
        version: '6.12.3',
        date: '2023-07-15',
        changelog: 'https://raw.githubusercontent.com/unraid/docs/main/docs/unraid-os/release-notes/6.12.3.md',
        changelogPretty: '',
        name: '6.12.3',
        isEligible: true,
        isNewer: true,  
        sha256: '1234567890'
    });
}

function showChangelogBrokenParse() {
    updateOsStore.setReleaseForUpdate({
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

function showChangelogFromLocalhost() {
    updateOsStore.setReleaseForUpdate({
        version: '6.12.3',
        date: '2023-07-15',
        changelog: 'https://raw.githubusercontent.com/unraid/docs/main/docs/unraid-os/release-notes/6.12.3.md',
        changelogPretty: 'http://localhost:3000/unraid-os/release-notes/6.12.3',
        name: '6.12.3',
        isEligible: true,
        isNewer: true,  
        sha256: '1234567890'
    });
}

</script>

<template>
    <div class="container mx-auto p-6">
        <h1 class="text-2xl font-bold mb-6">Changelog</h1>
        <UpdateOsChangelogModal :t="t" :open="changelogModalVisible" />
        <div class="mb-6 flex flex-col gap-4">
            <ColorSwitcherCe />
            <div class="max-w-md flex flex-col gap-4">
                <button 
                    class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600" 
                    @click="showChangelogModalFromReleasesEndpoint"
                >
                    Test Changelog Modal (from releases endpoint)
                </button>
                <button 
                    class="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600" 
                    @click="showChangelogFromLocalhost"
                >
                    Test Local Pretty Changelog (:3000)
                </button>
                <button 
                    class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600" 
                    @click="showChangelogModalWithTestData"
                >
                    Test Changelog Modal (with test data)
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
        </div>
    </div>
</template>
