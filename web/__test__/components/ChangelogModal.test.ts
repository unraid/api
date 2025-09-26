import { ref } from 'vue';
import { mount } from '@vue/test-utils';

import { DOCS } from '~/helpers/urls';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ChangelogModal from '~/components/UpdateOs/ChangelogModal.vue';

vi.mock('@unraid/ui', () => ({
  BrandButton: { template: '<button><slot /></button>' },
  BrandLoading: { template: '<div class="brand-loading" />' },
  cn: (...classes: string[]) => classes.filter(Boolean).join(' '),
  ResponsiveModal: { template: '<div><slot /></div>', props: ['open'] },
  ResponsiveModalFooter: { template: '<div><slot /></div>' },
  ResponsiveModalHeader: { template: '<div><slot /></div>' },
  ResponsiveModalTitle: { template: '<div><slot /></div>' },
}));

vi.mock('@heroicons/vue/24/solid', () => ({
  ArrowRightIcon: { template: '<svg />' },
  ArrowTopRightOnSquareIcon: { template: '<svg />' },
  KeyIcon: { template: '<svg />' },
  ServerStackIcon: { template: '<svg />' },
}));

vi.mock('~/components/UpdateOs/RawChangelogRenderer.vue', () => ({
  default: { template: '<div />', props: ['changelog', 'version', 'date', 't', 'changelogPretty'] },
}));

vi.mock('pinia', async () => {
  const actual = await vi.importActual<typeof import('pinia')>('pinia');

  const isActualStore = (candidate: unknown): candidate is Parameters<typeof actual.storeToRefs>[0] =>
    Boolean(candidate && typeof candidate === 'object' && '$id' in candidate);

  const isRefLike = (input: unknown): input is { value: unknown } =>
    Boolean(input && typeof input === 'object' && 'value' in input);

  return {
    ...actual,
    storeToRefs: (store: unknown) => {
      if (isActualStore(store)) {
        return actual.storeToRefs(store);
      }

      if (!store || typeof store !== 'object') {
        return {};
      }

      const refs: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(store)) {
        if (isRefLike(value)) {
          refs[key] = value;
        }
      }

      return refs;
    },
  };
});

const mockRenew = vi.fn();
vi.mock('~/store/purchase', () => ({
  usePurchaseStore: () => ({
    renew: mockRenew,
  }),
}));

const mockAvailableWithRenewal = ref(false);
const mockReleaseForUpdate = ref(null);
const mockChangelogModalVisible = ref(false);
const mockSetReleaseForUpdate = vi.fn();
const mockFetchAndConfirmInstall = vi.fn();
vi.mock('~/store/updateOs', () => ({
  useUpdateOsStore: () => ({
    availableWithRenewal: mockAvailableWithRenewal,
    releaseForUpdate: mockReleaseForUpdate,
    changelogModalVisible: mockChangelogModalVisible,
    setReleaseForUpdate: mockSetReleaseForUpdate,
    fetchAndConfirmInstall: mockFetchAndConfirmInstall,
  }),
}));

const mockDarkMode = ref(false);
const mockTheme = ref({ name: 'default' });
vi.mock('~/store/theme', () => ({
  useThemeStore: () => ({
    darkMode: mockDarkMode,
    theme: mockTheme,
  }),
}));

describe('ChangelogModal iframeSrc', () => {
  const mountWithChangelog = (changelogPretty: string | null) =>
    mount(ChangelogModal, {
      props: {
        t: (key: string) => key,
        open: true,
        release: {
          version: '6.12.0',
          changelogPretty: changelogPretty ?? undefined,
          changelog: 'Raw changelog markdown',
          name: 'Unraid OS 6.12.0',
          date: '2024-01-01',
        },
      },
    });

  beforeEach(() => {
    mockRenew.mockClear();
    mockAvailableWithRenewal.value = false;
    mockReleaseForUpdate.value = null;
    mockChangelogModalVisible.value = false;
    mockSetReleaseForUpdate.mockClear();
    mockFetchAndConfirmInstall.mockClear();
    mockDarkMode.value = false;
    mockTheme.value = { name: 'default' };
  });

  it('sanitizes absolute docs URLs to embed within DOCS origin', () => {
    const entry = `${DOCS.origin}/go/release-notes/?foo=bar#section`;
    const wrapper = mountWithChangelog(entry);

    const iframeSrc = (wrapper.vm as unknown as { iframeSrc: string | null }).iframeSrc;
    expect(iframeSrc).toBeTruthy();

    const iframeUrl = new URL(iframeSrc!);
    expect(iframeUrl.origin).toBe(DOCS.origin);
    expect(iframeUrl.pathname).toBe('/go/release-notes/');
    expect(iframeUrl.searchParams.get('embed')).toBe('1');
    expect(iframeUrl.searchParams.get('theme')).toBe('light');
    expect(iframeUrl.searchParams.get('entry')).toBe('/go/release-notes/?foo=bar#section');
  });

  it('builds DOCS-relative URL when provided a path entry', () => {
    const wrapper = mountWithChangelog('updates/6.12?tab=notes#overview');

    const iframeSrc = (wrapper.vm as unknown as { iframeSrc: string | null }).iframeSrc;
    expect(iframeSrc).toBeTruthy();

    const iframeUrl = new URL(iframeSrc!);
    expect(iframeUrl.origin).toBe(DOCS.origin);
    expect(iframeUrl.pathname).toBe('/updates/6.12');
    expect(iframeUrl.searchParams.get('entry')).toBe('/updates/6.12?tab=notes#overview');
  });

  it('applies dark theme when current UI theme requires it', () => {
    mockTheme.value = { name: 'azure' };
    const wrapper = mountWithChangelog(`${DOCS.origin}/release/6.12`);

    const iframeSrc = (wrapper.vm as unknown as { iframeSrc: string | null }).iframeSrc;
    expect(iframeSrc).toBeTruthy();

    const iframeUrl = new URL(iframeSrc!);
    expect(iframeUrl.searchParams.get('theme')).toBe('dark');
  });

  it('rejects non-docs origins and returns null', () => {
    const wrapper = mountWithChangelog('https://example.com/bad');

    const iframeSrc = (wrapper.vm as unknown as { iframeSrc: string | null }).iframeSrc;
    expect(iframeSrc).toBeNull();
  });

  it('rejects non-http(s) protocols', () => {
    const wrapper = mountWithChangelog('javascript:alert(1)');

    const iframeSrc = (wrapper.vm as unknown as { iframeSrc: string | null }).iframeSrc;
    expect(iframeSrc).toBeNull();
  });
});
