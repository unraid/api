<script setup lang="ts">
import { computed, onBeforeUnmount, ref, resolveComponent, watch } from 'vue';

import { useClipboardWithToast } from '@/composables/useClipboardWithToast';

type Primitive = string | number | boolean | null | undefined;

interface Props {
  /**
   * Values to display. Accepts either an array or a single primitive.
   */
  values?: Primitive[] | Primitive;
  /**
   * Maximum number of values to show inline before using the overflow popover.
   */
  inlineLimit?: number;
  /**
   * Short label describing the values. Used for accessibility and toast copy messaging.
   */
  label?: string;
  /**
   * Optional prefix to create stable element keys across renders (e.g., a row id).
   */
  idPrefix?: string;
  /**
   * Text shown when there are no values.
   */
  emptyText?: string;
  /**
   * Optional custom copy success message or builder function.
   */
  copyMessage?: string | ((value: string) => string);
  /**
   * Badge size token passed to UBadge.
   */
  size?: 'sm' | 'md';
  /**
   * Duration (ms) to keep the copied state highlighted.
   */
  feedbackDuration?: number;
}

const props = withDefaults(defineProps<Props>(), {
  values: () => [],
  inlineLimit: 3,
  label: 'Value',
  idPrefix: '',
  emptyText: '—',
  size: 'sm',
  feedbackDuration: 2000,
});

type ValueEntry = { value: string; index: number; key: string };

const UBadge = resolveComponent('UBadge');
const UPopover = resolveComponent('UPopover');
const UIcon = resolveComponent('UIcon');
const { copyWithNotification } = useClipboardWithToast();

function normalizeValues(input: Props['values']): string[] {
  if (Array.isArray(input)) {
    return input
      .map((value) => (value === null || value === undefined ? '' : String(value).trim()))
      .filter((value) => value.length > 0);
  }
  if (input === null || input === undefined) {
    return [];
  }
  const trimmed = String(input).trim();
  return trimmed ? [trimmed] : [];
}

function makeValueKey(prefix: string, value: string, index: number): string {
  const safePrefix = prefix?.length ? prefix : 'value';
  return `${safePrefix}-${index}-${value}`;
}

const normalizedValues = computed(() => normalizeValues(props.values));
const valueEntries = computed<ValueEntry[]>(() =>
  normalizedValues.value.map((value, index) => ({
    value,
    index,
    key: makeValueKey(props.idPrefix, value, index),
  }))
);

const inlineEntries = computed(() => valueEntries.value.slice(0, props.inlineLimit));
const overflowEntries = computed(() => valueEntries.value.slice(props.inlineLimit));
const hasValues = computed(() => valueEntries.value.length > 0);

const copiedBadgeKeys = ref<Set<string>>(new Set());
const badgeCopyTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

function clearBadgeTimeout(key: string) {
  const timeout = badgeCopyTimeouts.get(key);
  if (timeout) {
    clearTimeout(timeout);
    badgeCopyTimeouts.delete(key);
  }
}

function markBadgeCopied(key: string) {
  const next = new Set(copiedBadgeKeys.value);
  next.add(key);
  copiedBadgeKeys.value = next;

  clearBadgeTimeout(key);
  const timeoutId = setTimeout(() => {
    const updated = new Set(copiedBadgeKeys.value);
    updated.delete(key);
    copiedBadgeKeys.value = updated;
    badgeCopyTimeouts.delete(key);
  }, props.feedbackDuration);

  badgeCopyTimeouts.set(key, timeoutId);
}

function pruneObsoleteBadges() {
  const allowed = new Set(valueEntries.value.map((entry) => entry.key));
  const next = new Set<string>();
  for (const key of copiedBadgeKeys.value) {
    if (allowed.has(key)) {
      next.add(key);
      continue;
    }
    clearBadgeTimeout(key);
  }
  copiedBadgeKeys.value = next;
}

watch(valueEntries, pruneObsoleteBadges, { immediate: true });

function isBadgeCopied(key: string): boolean {
  return copiedBadgeKeys.value.has(key);
}

function getCopyMessage(value: string): string {
  if (typeof props.copyMessage === 'function') {
    return props.copyMessage(value);
  }
  if (typeof props.copyMessage === 'string' && props.copyMessage.length) {
    return props.copyMessage;
  }
  return `Copied ${props.label} to clipboard`;
}

async function handleCopy(entry: ValueEntry) {
  if (!entry.value) return;
  const success = await copyWithNotification(entry.value, getCopyMessage(entry.value));
  if (success) {
    markBadgeCopied(entry.key);
  }
}

function getBadgeTitle(key: string): string {
  return isBadgeCopied(key) ? 'Copied!' : 'Click to copy';
}

function getBadgeAriaLabel(key: string): string {
  return isBadgeCopied(key) ? `${props.label} copied to clipboard` : `Copy ${props.label} value`;
}

function getBadgeColor(key: string) {
  return isBadgeCopied(key) ? 'success' : 'neutral';
}

function getBadgeVariant(key: string) {
  return isBadgeCopied(key) ? 'solid' : 'subtle';
}

function handleBadgeKeydown(event: KeyboardEvent, entry: ValueEntry) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    void handleCopy(entry);
  }
}

onBeforeUnmount(() => {
  badgeCopyTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
  badgeCopyTimeouts.clear();
});
</script>

<template>
  <div v-if="hasValues" class="flex flex-wrap items-center gap-1">
    <component
      :is="UBadge"
      v-for="entry in inlineEntries"
      :key="entry.key"
      :color="getBadgeColor(entry.key)"
      :variant="getBadgeVariant(entry.key)"
      :size="size"
      :title="getBadgeTitle(entry.key)"
      :aria-label="getBadgeAriaLabel(entry.key)"
      data-stop-row-click="true"
      role="button"
      tabindex="0"
      class="max-w-[20ch] cursor-pointer items-center gap-1 truncate select-none"
      @click.stop="handleCopy(entry)"
      @keydown="handleBadgeKeydown($event, entry)"
    >
      <span class="flex min-w-0 items-center gap-1">
        <component
          :is="UIcon"
          v-if="isBadgeCopied(entry.key)"
          name="i-lucide-check"
          class="h-4 w-4 flex-shrink-0 text-white/90"
        />
        <span class="truncate">{{ entry.value }}</span>
      </span>
    </component>

    <component :is="UPopover" v-if="overflowEntries.length">
      <template #default>
        <span data-stop-row-click="true" @click.stop>
          <component
            :is="UBadge"
            color="neutral"
            variant="outline"
            :size="size"
            class="cursor-pointer select-none"
          >
            +{{ overflowEntries.length }} more
          </component>
        </span>
      </template>
      <template #content>
        <div class="max-h-64 max-w-xs space-y-1 overflow-y-auto p-1">
          <component
            :is="UBadge"
            v-for="entry in overflowEntries"
            :key="entry.key"
            :color="getBadgeColor(entry.key)"
            :variant="getBadgeVariant(entry.key)"
            :size="size"
            :title="getBadgeTitle(entry.key)"
            :aria-label="getBadgeAriaLabel(entry.key)"
            data-stop-row-click="true"
            role="button"
            tabindex="0"
            class="w-full cursor-pointer items-center justify-start gap-1 truncate select-none"
            @click.stop="handleCopy(entry)"
            @keydown="handleBadgeKeydown($event, entry)"
          >
            <span class="flex min-w-0 items-center gap-1">
              <component
                :is="UIcon"
                v-if="isBadgeCopied(entry.key)"
                name="i-lucide-check"
                class="h-4 w-4 flex-shrink-0 text-white/90"
              />
              <span class="truncate">{{ entry.value }}</span>
            </span>
          </component>
        </div>
      </template>
    </component>
  </div>
  <span v-else class="text-gray-500 dark:text-gray-400">{{ emptyText }}</span>
</template>
