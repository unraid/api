<script setup lang="ts">
import { computed, ref, onMounted, watch } from 'vue';
import { Markdown } from '@/helpers/markdown';
import { BrandButton } from '@unraid/ui';
import { ArrowTopRightOnSquareIcon } from '@heroicons/vue/24/solid';
import type { ComposerTranslation } from 'vue-i18n';

const props = defineProps<{
  changelog: string; // This is the URL to the changelog, not the content
  version?: string;
  date?: string;
  t: ComposerTranslation;
  changelogPretty?: string;
}>();

const parsedChangelog = ref<string>("");
const parsedChangelogTitle = ref<string>("");
const parseChangelogFailed = ref<string>("");
const isLoading = ref<boolean>(false);

// Fetch and parse the changelog using the same logic as in updateOsChangelog.ts
const fetchAndParseChangelog = async () => {
  if (!props.changelog) {
    isLoading.value = false;
    parseChangelogFailed.value = 'No changelog URL provided';
    return;
  }
  isLoading.value = true;
  parseChangelogFailed.value = "";
  try {
    // Fetch the changelog content from the URL
    const res = await fetch(props.changelog);
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} while fetching changelog`);
    }
    const data = await res.text();
    if (!data || data.trim() === "") {
      parseChangelogFailed.value = 'Changelog is empty';
      isLoading.value = false;
      return;
    }
    let firstHeading = true;
    const marked = Markdown.create();
    // open links in new tab & replace .md from links
    const renderer = new marked.Renderer();
    // Set base URL for relative links
    const baseUrl = "https://docs.unraid.net/go/release-notes/";
    renderer.link = ({ href, title, tokens }) => {
      const linkText = renderer.parser.parseInline(tokens);
      let cleanHref = href.replace(".md", ""); // remove .md from href
      if (cleanHref.startsWith("#")) {
        cleanHref = `${baseUrl}${props.version}${cleanHref}`;
      }
      if (!cleanHref.startsWith("http")) {
        cleanHref = `${baseUrl}${cleanHref}`;
      }
      return `<a href="${cleanHref}" ${title ? `title="${title}"` : ""} target="_blank" rel="noopener noreferrer">${linkText}</a>`;
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
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-");
        return `<h${depth} id="${id}">${text}</h${depth}>`;
      }
      return `<h${depth}>${text}</h${depth}>`;
    };
    marked.setOptions({
      renderer,
    });
    parsedChangelog.value = await marked.parse(
      (data as string) ?? "Changelog fetch data empty"
    );
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
    return parsedChangelog.value.replace(/<h1>(.*?)<\/h1>/, "");
  }
  return parsedChangelog.value;
});
</script>

<template>
  <div class="prose prose-sm dark:prose-invert max-w-none markdown-body p-4 overflow-auto">
    <div v-if="parseChangelogFailed" class="text-center flex flex-col gap-4 prose">
      <h2 class="text-lg text-unraid-red italic font-semibold">
        {{ props.t(`Error Parsing Changelog • {0}`, [parseChangelogFailed]) }}
      </h2>
      <p>
        {{
          props.t(`It's highly recommended to review the changelog before continuing your update`)
        }}
      </p>
      <div v-if="props.changelogPretty" class="flex self-center">
        <BrandButton
          :href="props.changelogPretty"
          variant="underline"
          :external="true"
          :icon-right="ArrowTopRightOnSquareIcon"
        >
          {{ props.t('View Changelog on Docs') }}
        </BrandButton>
      </div>
    </div>
    <div v-else-if="parsedChangelogTitle" class="mb-4">
      <h1>{{ parsedChangelogTitle }}</h1>
    </div>
    <div v-if="mutatedParsedChangelog" v-html="mutatedParsedChangelog"></div>
    <div v-else-if="isLoading" class="flex flex-col items-center justify-center py-8">
      <span class="mx-auto animate-spin border-2 border-gray-300 rounded-full w-8 h-8 border-t-unraid-red"></span>
      <p class="ml-2">{{ props.t('Loading changelog...') }}</p>
    </div>
    <div v-else class="text-center py-8">
      <p>{{ props.t('No changelog content available') }}</p>
    </div>
  </div>
</template> 