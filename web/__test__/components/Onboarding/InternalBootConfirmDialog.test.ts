import { mount } from '@vue/test-utils';

import { describe, expect, it } from 'vitest';

import InternalBootConfirmDialog from '~/components/Onboarding/components/InternalBootConfirmDialog.vue';
import { createTestI18n } from '../../utils/i18n';

describe('InternalBootConfirmDialog', () => {
  it('explains USB licensing behavior and links to the TPM licensing FAQ', () => {
    const alertStub = {
      props: ['description'],
      template: '<div>{{ description }}<slot name="description" /></div>',
    };
    const buttonStub = {
      template: '<button><slot /></button>',
    };
    const iconStub = {
      template: '<span />',
    };
    const modalStub = {
      props: ['open', 'title', 'description'],
      template: `
        <div v-if="open">
          <h2>{{ title }}</h2>
          <p>{{ description }}</p>
          <slot name="body" />
          <slot name="footer" />
        </div>
      `,
    };

    const wrapper = mount(InternalBootConfirmDialog, {
      props: {
        open: true,
        action: 'reboot',
      },
      global: {
        plugins: [createTestI18n()],
        stubs: {
          Alert: alertStub,
          Button: buttonStub,
          Icon: iconStub,
          Modal: modalStub,
          UAlert: alertStub,
          UButton: buttonStub,
          UIcon: iconStub,
          UModal: modalStub,
        },
      },
    });

    expect(wrapper.text()).toContain('To complete internal boot setup');
    expect(wrapper.text()).toContain('please do NOT remove your Unraid flash drive');
    expect(wrapper.text()).toContain(
      "Switching to internal boot doesn't automatically move your license"
    );
    expect(wrapper.text()).toContain(
      'If your license is still linked to the USB, it must remain connected.'
    );
    expect(wrapper.findAll('br')).toHaveLength(2);
    expect(wrapper.get('strong').text()).toBe('Want to ditch the USB entirely?');
    expect(wrapper.text()).toContain('Once switched, the USB drive will no longer be required');
    expect(wrapper.text()).toContain('Learn about TPM licensing');
    expect(wrapper.get('a').attributes('href')).toBe(
      'https://docs.unraid.net/unraid-os/troubleshooting/tpm-licensing-faq/'
    );
  });
});
