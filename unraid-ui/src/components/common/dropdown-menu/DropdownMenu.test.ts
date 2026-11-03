import DropdownMenu from '@/components/common/dropdown-menu/DropdownMenu.vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';

describe('DropdownMenu', () => {
  it('forwards panel sizing to the content while preserving trigger and account content', () => {
    const wrapper = mount(DropdownMenu, {
      props: { contentClass: 'account-panel', align: 'end', sideOffset: 8 },
      slots: { trigger: '<button>Account</button>', content: '<p>Signed in as Tower</p>' },
      global: {
        stubs: {
          DropdownMenuRoot: { template: '<div><slot /></div>' },
          DropdownMenuTrigger: { template: '<div><slot /></div>' },
          DropdownMenuContent: {
            name: 'DropdownMenuContent',
            props: ['align', 'side', 'sideOffset'],
            template: '<section><slot /></section>',
          },
        },
      },
    });

    expect(wrapper.get('section').classes()).toContain('account-panel');
    expect(wrapper.get('button').classes()).not.toContain('account-panel');
    expect(wrapper.get('section').text()).toBe('Signed in as Tower');
    expect(wrapper.findComponent({ name: 'DropdownMenuContent' }).props()).toMatchObject({
      align: 'end',
      sideOffset: 8,
    });
    wrapper.unmount();
  });
});
