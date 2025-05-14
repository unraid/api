import { computed, ref, watch } from 'vue';
import { defineStore } from 'pinia';

import { Markdown } from '@/helpers/markdown';
import { DOCS_RELEASE_NOTES } from '~/helpers/urls';
import { baseUrl } from 'marked-base-url';
import prerelease from 'semver/functions/prerelease';

import type { ServerUpdateOsResponse } from '~/types/server';

import { request } from '~/composables/services/request';
import { useCallbackActionsStore } from '~/store/callbackActions';

export const useUpdateOsChangelogStore = defineStore('updateOsChangelog', () => {
  const callbackStore = useCallbackActionsStore();

  const releaseForUpdate = ref<ServerUpdateOsResponse | null>(null);
  watch(releaseForUpdate, async (newVal, oldVal) => {
    console.debug('[releaseForUpdate] watch', newVal, oldVal);
    resetChangelogDetails(); // reset values when setting and unsetting a selected release
    // Fetch and parse the changelog when the user selects a release
    if (newVal) {
      console.debug('[releaseForUpdate] fetchAndParseChangelog', newVal);
      await fetchAndParseChangelog();
    }
  });

  const changelogUrl = computed((): string => {
    if (!releaseForUpdate.value || !releaseForUpdate.value?.changelog) {
      return '';
    }
    return (
      releaseForUpdate.value?.changelog ??
      `https://raw.githubusercontent.com/unraid/docs/main/docs/unraid-os/release-notes/${releaseForUpdate.value.version}.md`
    );
  });

  const isReleaseForUpdateStable = computed(() =>
    releaseForUpdate.value ? prerelease(releaseForUpdate.value.version) === null : false
  );
  const parsedChangelog = ref<string>('');
  const parseChangelogFailed = ref<string>('');
  // used to remove the first <h1></h1> and it's contents from the parsedChangelog
  const mutatedParsedChangelog = computed(() => {
    if (parsedChangelog.value) {
      return parsedChangelog.value.replace(/<h1>(.*?)<\/h1>/, '');
    }
    return parsedChangelog.value;
  });
  // used to extract the first <h1></h1> and it's contents from the parsedChangelog for the modal header title
  const parsedChangelogTitle = computed(() => {
    if (parseChangelogFailed.value) {
      return parseChangelogFailed.value;
    }
    if (parsedChangelog.value) {
      return (
        parsedChangelog.value.match(/<h1>(.*?)<\/h1>/)?.[1] ??
        `Version ${releaseForUpdate.value?.version} ${releaseForUpdate.value?.date}`
      );
    }
    return '';
  });

  const setReleaseForUpdate = (release: ServerUpdateOsResponse | null) => {
    console.debug('[setReleaseForUpdate]', release);
    releaseForUpdate.value = release;
  };
  const resetChangelogDetails = () => {
    console.debug('[resetChangelogDetails]');
    parsedChangelog.value = '';
    parseChangelogFailed.value = '';
  };
  const fetchAndParseChangelog = async () => {
    console.debug('[fetchAndParseChangelog]');
    try {
      const changelogMarkdownRaw = await request
        .url(changelogUrl.value ?? '')
        .get()
        .text();

      // set base url for relative links
      const marked = Markdown.create(baseUrl(DOCS_RELEASE_NOTES.toString()));

      // open links in new tab & replace .md from links
      const renderer = new marked.Renderer();

      renderer.link = ({ href, title, tokens }) => {
        const linkText = renderer.parser.parseInline(tokens);
        const cleanHref = href.replace('.md', ''); // remove .md from href
        return `<a href="${cleanHref}" ${title ? `title="${title}"` : ''} target="_blank">${linkText}</a>`;
      };

      marked.setOptions({
        renderer,
      });

      parsedChangelog.value = await marked.parse(changelogMarkdownRaw);
    } catch (error: unknown) {
      const caughtError = error as Error;
      parseChangelogFailed.value =
        caughtError && caughtError?.message
          ? caughtError.message
          : `Failed to parse ${releaseForUpdate.value?.version} changelog`;
    }
  };

  const fetchAndConfirmInstall = (sha256: string) => {
    callbackStore.send(
      window.location.href,
      [
        {
          sha256,
          type: 'updateOs',
        },
      ],
      undefined,
      'forUpc'
    );
  };

  return {
    // state
    parseChangelogFailed,
    releaseForUpdate,
    // getters
    isReleaseForUpdateStable,
    mutatedParsedChangelog,
    parsedChangelogTitle,
    // actions
    setReleaseForUpdate,
    fetchAndConfirmInstall,
  };
});
