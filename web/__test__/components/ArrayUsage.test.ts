import { nextTick, ref } from 'vue';
import { mount } from '@vue/test-utils';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import ArrayUsage from '~/components/Header/ArrayUsage.vue';

interface ArrayResult {
  array?: {
    state: string;
    capacity: { kilobytes: { total: string; free: string } };
  } | null;
}

const result = ref<ArrayResult>();
const error = ref<Error>();

vi.mock('@vue/apollo-composable', () => ({ useQuery: () => ({ result, error }) }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ t: (key: string) => key }) }));

describe('ArrayUsage', () => {
  beforeEach(() => {
    result.value = undefined;
    error.value = undefined;
  });

  it('preserves its mounted footprint until capacity arrives without announcing offline', async () => {
    const wrapper = mount(ArrayUsage, { props: { compact: true } });
    const root = wrapper.element;
    expect(wrapper.attributes('aria-hidden')).toBe('true');
    expect(wrapper.text()).not.toContain('headerArrayUsage.offline');

    result.value = {
      array: { state: 'STARTED', capacity: { kilobytes: { total: '100', free: '62' } } },
    };
    await nextTick();

    expect(wrapper.element).toBe(root);
    expect(wrapper.attributes('aria-hidden')).toBeUndefined();
    expect(wrapper.text()).toContain('38%');
    expect(wrapper.text()).not.toContain('headerArrayUsage.offline');
    wrapper.unmount();
  });

  it('keeps unavailable capacity hidden after a query error', async () => {
    const wrapper = mount(ArrayUsage, { props: { compact: true } });
    const root = wrapper.element;
    error.value = new Error('Capacity request failed');
    await nextTick();

    expect(wrapper.element).toBe(root);
    expect(wrapper.attributes('aria-hidden')).toBe('true');
    expect(wrapper.text()).not.toContain('headerArrayUsage.offline');
    wrapper.unmount();
  });

  it('announces offline only when the array has resolved as stopped', async () => {
    const wrapper = mount(ArrayUsage, { props: { compact: true } });
    result.value = {
      array: { state: 'STOPPED', capacity: { kilobytes: { total: '100', free: '62' } } },
    };
    await nextTick();

    expect(wrapper.attributes('aria-hidden')).toBeUndefined();
    expect(wrapper.text()).toContain('headerArrayUsage.offline');
    expect(wrapper.text()).not.toContain('38%');
    wrapper.unmount();
  });
});
