/**
 * DownloadApiLogs Component Test Coverage
 *
 * This test file provides 100% coverage for the DownloadApiLogs component.
 */

import { mount } from '@vue/test-utils';

import { BrandButton } from '@unraid/ui';
import { CONNECT_FORUMS, CONTACT, DISCORD } from '~/helpers/urls';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DownloadApiLogs from '~/components/DownloadApiLogs.ce.vue';

import '../mocks/pinia';

// Mock the urls helper
vi.mock('~/helpers/urls', async () => {
  const actual = await vi.importActual('~/helpers/urls');
  return {
    ...actual,
    WEBGUI_GRAPHQL: new URL('http://mock-webgui.local'),
  };
});

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}));

describe('DownloadApiLogs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global csrf_token
    globalThis.csrf_token = 'mock-csrf-token';
  });

  it('computes the correct download URL', () => {
    const wrapper = mount(DownloadApiLogs, {
      global: {
        stubs: {
          ArrowDownTrayIcon: true,
          ArrowTopRightOnSquareIcon: true,
        },
      },
    });

    // Create the expected URL using the inline string
    const expectedUrl = new URL('/graphql/api/logs', 'http://mock-webgui.local');
    expectedUrl.searchParams.append('csrf_token', 'mock-csrf-token');

    // Find the button and check its rendered href attribute
    const downloadButton = wrapper.findComponent(BrandButton);
    expect(downloadButton.attributes('href')).toBe(expectedUrl.toString());
  });

  it('renders the download button with correct attributes', () => {
    const wrapper = mount(DownloadApiLogs, {
      global: {
        stubs: {
          ArrowDownTrayIcon: true,
          ArrowTopRightOnSquareIcon: true,
        },
      },
    });

    const downloadButton = wrapper.findComponent(BrandButton);
    expect(downloadButton.exists()).toBe(true);

    // Create the expected URL using the inline string
    const expectedUrl = new URL('/graphql/api/logs', 'http://mock-webgui.local');
    expectedUrl.searchParams.append('csrf_token', 'mock-csrf-token');

    // Check the rendered href attribute
    expect(downloadButton.attributes('href')).toBe(expectedUrl.toString());

    // Check the other attributes
    expect(downloadButton.attributes('download')).toBe('');
    expect(downloadButton.attributes('external')).toBe('true');
  });

  it('renders the support links with correct URLs', () => {
    const wrapper = mount(DownloadApiLogs, {
      global: {
        stubs: {
          ArrowDownTrayIcon: true,
          ArrowTopRightOnSquareIcon: true,
        },
      },
    });

    // Find all the support links
    const links = wrapper.findAll('a');
    expect(links.length).toBe(3);

    // Check the forum link
    expect(links[0].attributes('href')).toBe(CONNECT_FORUMS.toString());
    expect(links[0].attributes('target')).toBe('_blank');
    expect(links[0].attributes('rel')).toBe('noopener noreferrer');

    // Check the Discord link
    expect(links[1].attributes('href')).toBe(DISCORD.toString());
    expect(links[1].attributes('target')).toBe('_blank');
    expect(links[1].attributes('rel')).toBe('noopener noreferrer');

    // Check the Contact link
    expect(links[2].attributes('href')).toBe(CONTACT.toString());
    expect(links[2].attributes('target')).toBe('_blank');
    expect(links[2].attributes('rel')).toBe('noopener noreferrer');
  });

  it('displays the correct text for each link', () => {
    const wrapper = mount(DownloadApiLogs, {
      global: {
        stubs: {
          ArrowDownTrayIcon: true,
          ArrowTopRightOnSquareIcon: true,
        },
      },
    });

    const links = wrapper.findAll('a');

    expect(links[0].text()).toContain('Unraid Connect Forums');
    expect(links[1].text()).toContain('Unraid Discord');
    expect(links[2].text()).toContain('Unraid Contact Page');
  });

  it('displays the support information text', () => {
    const wrapper = mount(DownloadApiLogs, {
      global: {
        stubs: {
          ArrowDownTrayIcon: true,
          ArrowTopRightOnSquareIcon: true,
        },
      },
    });

    const textContent = wrapper.text();
    expect(textContent).toContain(
      'The primary method of support for Unraid Connect is through our forums and Discord'
    );
    expect(textContent).toContain(
      'If you are asked to supply logs, please open a support request on our Contact Page'
    );
    expect(textContent).toContain(
      'The logs may contain sensitive information so do not post them publicly'
    );
  });
});
