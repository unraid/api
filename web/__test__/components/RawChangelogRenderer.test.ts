import { flushPromises, mount } from '@vue/test-utils';

import { afterEach, describe, expect, it, vi } from 'vitest';

import RawChangelogRenderer from '~/components/UpdateOs/RawChangelogRenderer.vue';
import { createTestI18n } from '../utils/i18n';

vi.mock('@unraid/ui', () => ({
  BrandButton: { template: '<a><slot /></a>' },
  BrandLoading: { template: '<svg aria-label="Unraid loader" />' },
}));

afterEach(() => vi.unstubAllGlobals());

describe('RawChangelogRenderer', () => {
  it('shows the Unraid loader, then release sections without duplicating the modal title', async () => {
    let finish: (response: Response) => void = () => {};
    const pending = new Promise<Response>((resolve) => {
      finish = resolve;
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => pending.then((response) => response.clone()))
    );
    const wrapper = mount(RawChangelogRenderer, {
      props: { changelog: '/release.md', version: '7.3.0', date: '2026-10-23' },
      global: { plugins: [createTestI18n()] },
    });
    expect(wrapper.find('[role="status"]').text()).toBe('Loading release notes');
    expect(wrapper.find('[aria-label="Unraid loader"]').exists()).toBe(true);

    finish(new Response('# Unraid 7.3.0\n\n## Changes\n\n- Fixed an update issue.'));
    await flushPromises();
    expect(wrapper.find('[role="status"]').exists()).toBe(false);
    expect(wrapper.find('h1').exists()).toBe(false);
    expect(wrapper.find('h2').text()).toBe('Changes');
    expect(wrapper.text()).toContain('2026-10-23');
    expect(wrapper.text()).toContain('Fixed an update issue.');
    wrapper.unmount();
  });
});
