<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';

import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import { BrandButton } from '@unraid/ui';
import { Markdown } from '@/helpers/markdown';

const props = defineProps<{
  changelog: string; // This is the URL to the changelog, not the content
  version?: string;
  date?: string;
  changelogPretty?: string;
}>();
const { t } = useI18n();

const parsedChangelog = ref<string>('');
const parsedChangelogTitle = ref<string>('');
const parseChangelogFailed = ref<string>('');
const isLoading = ref<boolean>(false);

// Fetch and parse the changelog using the same logic as in updateOsChangelog.ts
const fetchAndParseChangelog = async () => {
  if (!props.changelog) {
    isLoading.value = false;
    parseChangelogFailed.value = 'No changelog URL provided';
    return;
  }
  isLoading.value = true;
  parseChangelogFailed.value = '';
  try {
    // Fetch the changelog content from the URL
    const res = await fetch(props.changelog);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} while fetching changelog`);
    }
    const data = await res.text();
    if (!data || data.trim() === '') {
      parseChangelogFailed.value = 'Changelog is empty';
      isLoading.value = false;
      return;
    }
    let firstHeading = true;
    const marked = Markdown.create();
    // open links in new tab & replace .md from links
    const renderer = new marked.Renderer();
    // Set base URL for relative links
    const baseUrl = 'https://docs.unraid.net/go/release-notes/';
    renderer.link = ({ href, title, tokens }) => {
      const linkText = renderer.parser.parseInline(tokens);
      let cleanHref = href.replace('.md', ''); // remove .md from href
      if (cleanHref.startsWith('#')) {
        cleanHref = `${baseUrl}${props.version}${cleanHref}`;
      }
      if (!cleanHref.startsWith('http')) {
        cleanHref = `${baseUrl}${cleanHref}`;
      }
      return `<a href="${cleanHref}" ${title ? `title="${title}"` : ''} target="_blank" rel="noopener noreferrer">${linkText}</a>`;
    };
    // Add heading renderer
    renderer.heading = ({ text, depth }) => {
      // Capture the first h1 title
      if (depth === 1 && firstHeading) {
        firstHeading = false;
        parsedChangelogTitle.value = `Version ${props.version} ${props.date ? `(${props.date})` : ''}`;
        return `<br />`;
      }
      // Only add IDs for h2 and above (depth > 1)
      if (depth > 1) {
        const id = text
          .toLowerCase()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-');
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      }
      return `<h${depth}>${text}</h${depth}>`;
    };
    marked.setOptions({
      renderer,
    });
    parsedChangelog.value = await marked.parse((data as string) ?? 'Changelog fetch data empty');
  } catch (error: unknown) {
    const caughtError = error as Error;
    parseChangelogFailed.value =
      caughtError && caughtError?.message
        ? caughtError.message
        : `Failed to parse ${props.version} changelog`;
  } finally {
    isLoading.value = false;
  }
};

// Parse the changelog when the component is mounted or props change
onMounted(fetchAndParseChangelog);
watch(() => props.changelog, fetchAndParseChangelog, { immediate: true });

// Used to remove the first <h1></h1> and its contents from the parsedChangelog
const mutatedParsedChangelog = computed(() => {
  if (parsedChangelog.value) {
    return parsedChangelog.value.replace(/<h1>(.*?)<\/h1>/, '');
  }
  return parsedChangelog.value;
});
</script>

<template>
  <div
    class="prose prose-sm dark:prose-invert max-w-none overflow-auto p-4 [&_.grid]:!flex [&_.grid]:!flex-wrap [&_.grid]:!gap-8 [&_.grid>*]:!flex-1 [&_.grid>*]:!basis-full md:[&_.grid>*]:!basis-[calc(50%-1rem)]"
  >
    <div v-if="parseChangelogFailed" class="prose flex flex-col gap-4 text-center">
      <h2 class="text-unraid-red text-lg font-semibold italic">
        {{ t('updateOs.rawChangelogRenderer.errorParsingChangelog', [parseChangelogFailed]) }}
      </h2>
      <p>
        {{ t('updateOs.rawChangelogRenderer.itSHighlyRecommendedToReview') }}
      </p>
      <div v-if="props.changelogPretty" class="flex self-center">
        <BrandButton
          :href="props.changelogPretty"
          variant="underline"
          :external="true"
          :icon-right="ArrowTopRightOnSquareIcon"
        >
          {{ t('updateOs.rawChangelogRenderer.viewChangelogOnDocs') }}
        </BrandButton>
      </div>
    </div>
    <div v-else-if="parsedChangelogTitle" class="mb-4">
      <h1>{{ parsedChangelogTitle }}</h1>
    </div>
    <div v-if="mutatedParsedChangelog" v-html="mutatedParsedChangelog" />
    <div v-else-if="isLoading" class="flex flex-col items-center justify-center py-8">
      <span
        class="border-t-unraid-red mx-auto h-8 w-8 animate-spin rounded-full border-2 border-gray-300"
      />
      <p class="ml-2">{{ t('updateOs.rawChangelogRenderer.loadingChangelog') }}</p>
    </div>
    <div v-else class="py-8 text-center">
      <p>{{ t('updateOs.rawChangelogRenderer.noChangelogContentAvailable') }}</p>
    </div>
  </div>
</template>
