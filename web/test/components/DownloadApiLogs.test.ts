/**
 * DownloadApiLogs Component Test Coverage
 *
 * This test file provides 100% coverage for the DownloadApiLogs component.
 */

import { mount } from '@vue/test-utils';

import { BrandButton } from '@unraid/ui';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import DownloadApiLogs from '~/components/DownloadApiLogs.ce.vue';

// Mock the urls helper with a predictable mock URL
vi.mock('~/helpers/urls', () => ({
  CONNECT_FORUMS: new URL('http://mock-forums.local'),
  CONTACT: new URL('http://mock-contact.local'),
  DISCORD: new URL('http://mock-discord.local'),
  WEBGUI_GRAPHQL: new URL('http://mock-webgui.local'),
}));

// Mock vue-i18n with a simple implementation
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

  it('provides a download button with the correct URL', () => {
    const wrapper = mount(DownloadApiLogs, {
      global: {
        stubs: {
          ArrowDownTrayIcon: true,
          ArrowTopRightOnSquareIcon: true,
        },
      },
    });

    // Expected download URL
    const expectedUrl = new URL('/graphql/api/logs', 'http://mock-webgui.local');
    expectedUrl.searchParams.append('csrf_token', 'mock-csrf-token');

    // Find the download button
    const downloadButton = wrapper.findComponent(BrandButton);

    // Verify download button exists and has correct attributes
    expect(downloadButton.exists()).toBe(true);
    expect(downloadButton.attributes('href')).toBe(expectedUrl.toString());
    expect(downloadButton.attributes('download')).toBe('');
    expect(downloadButton.attributes('external')).toBe('true');
    expect(downloadButton.text()).toContain('Download unraid-api Logs');
  });

  it('displays support links to documentation and help resources', () => {
    const wrapper = mount(DownloadApiLogs, {
      global: {
        stubs: {
          ArrowDownTrayIcon: true,
          ArrowTopRightOnSquareIcon: true,
        },
      },
    });

    // Find all support links
    const links = wrapper.findAll('a');
    expect(links.length).toBe(3);

    // Verify each link has correct href and text
    expect(links[0].attributes('href')).toBe('http://mock-forums.local/');
    expect(links[0].text()).toContain('Unraid Connect Forums');

    expect(links[1].attributes('href')).toBe('http://mock-discord.local/');
    expect(links[1].text()).toContain('Unraid Discord');

    expect(links[2].attributes('href')).toBe('http://mock-contact.local/');
    expect(links[2].text()).toContain('Unraid Contact Page');

    // Verify all links open in new tab
    links.forEach((link) => {
      expect(link.attributes('target')).toBe('_blank');
      expect(link.attributes('rel')).toBe('noopener noreferrer');
    });
  });

  it('displays instructions about log usage and privacy', () => {
    const wrapper = mount(DownloadApiLogs, {
      global: {
        stubs: {
          ArrowDownTrayIcon: true,
          ArrowTopRightOnSquareIcon: true,
        },
      },
    });

    const text = wrapper.text();

    // Verify key instructional text is present
    expect(text).toContain(
      'The primary method of support for Unraid Connect is through our forums and Discord'
    );
    expect(text).toContain('If you are asked to supply logs');
    expect(text).toContain('The logs may contain sensitive information so do not post them publicly');
  });
});
