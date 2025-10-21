/**
 * DownloadApiLogs Component Test Coverage
 */

import { mount } from '@vue/test-utils';

import { BrandButton } from '@unraid/ui';
import { createTestingPinia } from '@pinia/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DownloadApiLogs from '~/components/DownloadApiLogs.standalone.vue';
import { createTestI18n, testTranslate } from '../utils/i18n';

vi.mock('~/helpers/urls', () => ({
  CONNECT_FORUMS: new URL('http://mock-forums.local'),
  CONTACT: new URL('http://mock-contact.local'),
  DISCORD: new URL('http://mock-discord.local'),
  WEBGUI_GRAPHQL: '/graphql',
}));

vi.mock('vue-i18n', async (importOriginal) => {
  const actual = (await importOriginal()) as typeof import('vue-i18n');
  return {
    ...actual,
    useI18n: () => ({
      t: testTranslate,
    }),
  };
});

describe('DownloadApiLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global csrf_token
    globalThis.csrf_token = 'mock-csrf-token';
  });

  it('provides a download button with the correct URL', () => {
    const wrapper = mount(DownloadApiLogs, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
        stubs: {
          ArrowDownTrayIcon: true,
          ArrowTopRightOnSquareIcon: true,
        },
      },
    });

    // Expected download URL
    const expectedUrl = '/graphql/api/logs?csrf_token=mock-csrf-token';

    // Find the download button
    const downloadButton = wrapper.findComponent(BrandButton);

    // Verify download button exists and has correct attributes
    expect(downloadButton.exists()).toBe(true);
    expect(downloadButton.attributes('href')).toBe(expectedUrl);
    expect(downloadButton.attributes('download')).toBe('');
    expect(downloadButton.attributes('target')).toBe('_blank');
    expect(downloadButton.attributes('rel')).toBe('noopener noreferrer');
    expect(downloadButton.text()).toContain(testTranslate('downloadApiLogs.downloadUnraidApiLogs'));
  });

  it('displays support links to documentation and help resources', () => {
    const wrapper = mount(DownloadApiLogs, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
        stubs: {
          ArrowDownTrayIcon: true,
          ArrowTopRightOnSquareIcon: true,
        },
      },
    });

    const links = wrapper.findAll('a');
    expect(links.length).toBe(4);

    expect(links[1].attributes('href')).toBe('http://mock-forums.local/');
    expect(links[1].text()).toContain(testTranslate('downloadApiLogs.unraidConnectForums'));

    expect(links[2].attributes('href')).toBe('http://mock-discord.local/');
    expect(links[2].text()).toContain(testTranslate('downloadApiLogs.unraidDiscord'));

    expect(links[3].attributes('href')).toBe('http://mock-contact.local/');
    expect(links[3].text()).toContain(testTranslate('downloadApiLogs.unraidContactPage'));

    links.slice(1).forEach((link) => {
      expect(link.attributes('target')).toBe('_blank');
      expect(link.attributes('rel')).toBe('noopener noreferrer');
    });
  });

  it('displays instructions about log usage and privacy', () => {
    const wrapper = mount(DownloadApiLogs, {
      global: {
        plugins: [createTestingPinia({ createSpy: vi.fn }), createTestI18n()],
        stubs: {
          ArrowDownTrayIcon: true,
          ArrowTopRightOnSquareIcon: true,
        },
      },
    });

    const text = wrapper.text();

    expect(text).toContain(testTranslate('downloadApiLogs.thePrimaryMethodOfSupportFor'));
    expect(text).toContain(testTranslate('downloadApiLogs.ifYouAreAskedToSupply'));
    expect(text).toContain(testTranslate('downloadApiLogs.theLogsMayContainSensitiveInformation'));
  });
});
