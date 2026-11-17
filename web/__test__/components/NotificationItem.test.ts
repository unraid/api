import { flushPromises, mount } from '@vue/test-utils';

import { Markdown } from '~/helpers/markdown';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Item from '~/components/Notifications/Item.vue';
import { NotificationImportance, NotificationType } from '~/composables/gql/graphql';
import { createTestI18n } from '../utils/i18n';

vi.mock('@unraid/ui', () => ({
  Button: { template: '<button><slot /></button>' },
}));

afterEach(() => vi.restoreAllMocks());

describe('notification descriptions', () => {
  it.each([false, true])('sanitizes rendered content when parsing fails: %s', async (parseFails) => {
    if (parseFails) {
      vi.spyOn(Markdown, 'parse').mockRejectedValue(new Error('Parse failed'));
      vi.spyOn(console, 'error').mockImplementation(() => {});
    }

    const wrapper = mount(Item, {
      props: {
        id: 'notification-1',
        title: 'Notification',
        subject: 'Disk status',
        description:
          '<div><style>body { display: none }</style><strong style="position:fixed">Disk healthy</strong><img src="x" onerror="alert(1)"><script>alert(1)</script><a href="javascript:alert(1)">Details</a></div>',
        importance: NotificationImportance.INFO,
        type: NotificationType.UNREAD,
      },
      global: { plugins: [createTestI18n()] },
    });

    await flushPromises();

    expect(wrapper.get('strong').text()).toBe('Disk healthy');
    expect(wrapper.find('style, script, [style], [onerror]').exists()).toBe(false);
    expect(wrapper.get('a').attributes('href')).toBeUndefined();
    wrapper.unmount();
  });
});
