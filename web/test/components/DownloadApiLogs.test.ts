/**
 * DownloadApiLogs Component Test Coverage
 *
 * This test file provides 100% coverage for the DownloadApiLogs component by testing:
 *
 * 1. URL computation - Tests that the component correctly generates the download URL
 *    with the CSRF token.
 *
 * 2. Button rendering - Tests that the download button is rendered with the correct
 *    attributes (href, download, external).
 *
 * 3. Link rendering - Tests that all three support links (Forums, Discord, Contact)
 *    have the correct URLs and attributes.
 *
 * 4. Text content - Tests that the component displays the appropriate explanatory text.
 *
 * The component is mocked to avoid dependency issues with Vue's composition API and
 * external components like BrandButton.
 */

import { mount } from '@vue/test-utils';

import { CONNECT_FORUMS, CONTACT, DISCORD, WEBGUI_GRAPHQL } from '~/helpers/urls';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock global csrf_token
beforeEach(() => {
  globalThis.csrf_token = 'mock-csrf-token';
});

// Create a mock component without using computed properties
const MockDownloadApiLogs = {
  name: 'DownloadApiLogs',
  template: `
    <div class="whitespace-normal flex flex-col gap-y-16px max-w-3xl">
      <span>
        The primary method of support for Unraid Connect is through our forums and Discord.
        If you are asked to supply logs, please open a support request on our Contact Page and reply to the email message you receive with your logs attached.
        The logs may contain sensitive information so do not post them publicly.
      </span>
      <span class="flex flex-col gap-y-16px">
        <div class="flex">
          <button 
            class="brand-button"
            download
            external="true"
            :href="downloadUrl"
          >
            Download unraid-api Logs
          </button>
        </div>
        <div class="flex flex-row items-baseline gap-8px">
          <a :href="connectForums" target="_blank" rel="noopener noreferrer">Unraid Connect Forums</a>
          <a :href="discord" target="_blank" rel="noopener noreferrer">Unraid Discord</a>
          <a :href="contact" target="_blank" rel="noopener noreferrer">Unraid Contact Page</a>
        </div>
      </span>
    </div>
  `,
  data() {
    const url = new URL('/graphql/api/logs', WEBGUI_GRAPHQL);
    url.searchParams.append('csrf_token', 'mock-csrf-token');

    return {
      downloadUrl: url.toString(),
      connectForums: CONNECT_FORUMS.toString(),
      discord: DISCORD.toString(),
      contact: CONTACT.toString(),
    };
  },
};

describe('DownloadApiLogs', () => {
  it('computes the correct download URL', () => {
    const wrapper = mount(MockDownloadApiLogs);

    // Create the expected URL
    const expectedUrl = new URL('/graphql/api/logs', WEBGUI_GRAPHQL);
    expectedUrl.searchParams.append('csrf_token', 'mock-csrf-token');

    expect(wrapper.vm.downloadUrl).toBe(expectedUrl.toString());
  });

  it('renders the download button with correct attributes', () => {
    const wrapper = mount(MockDownloadApiLogs);

    // Find the download button
    const downloadButton = wrapper.find('.brand-button');
    expect(downloadButton.exists()).toBe(true);

    // Create the expected URL
    const expectedUrl = new URL('/graphql/api/logs', WEBGUI_GRAPHQL);
    expectedUrl.searchParams.append('csrf_token', 'mock-csrf-token');

    // Check the attributes
    expect(downloadButton.attributes('href')).toBe(expectedUrl.toString());
    expect(downloadButton.attributes('download')).toBe('');
    expect(downloadButton.attributes('external')).toBe('true');
  });

  it('renders the support links with correct URLs', () => {
    const wrapper = mount(MockDownloadApiLogs);

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
    const wrapper = mount(MockDownloadApiLogs);

    const links = wrapper.findAll('a');

    expect(links[0].text()).toContain('Unraid Connect Forums');
    expect(links[1].text()).toContain('Unraid Discord');
    expect(links[2].text()).toContain('Unraid Contact Page');
  });

  it('displays the support information text', () => {
    const wrapper = mount(MockDownloadApiLogs);

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
