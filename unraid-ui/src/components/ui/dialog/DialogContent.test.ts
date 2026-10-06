import DialogContent from '@/components/ui/dialog/DialogContent.vue';
import { mount } from '@vue/test-utils';
import { DialogDescription, DialogRoot, DialogTitle } from 'reka-ui';
import { describe, expect, it } from 'vitest';
import { defineComponent, h, nextTick, shallowRef, type HTMLAttributes } from 'vue';

describe('DialogContent animations', () => {
  it.each<{ classes: HTMLAttributes['class']; fullscreen: boolean }>([
    { classes: 'min-h-screen', fullscreen: true },
    { classes: ['p-4', ['min-h-screen']], fullscreen: true },
    { classes: { 'min-h-screen': true }, fullscreen: true },
    { classes: { 'min-h-screen': false }, fullscreen: false },
    { classes: false, fullscreen: false },
    { classes: 'min-h-screen-extra', fullscreen: false },
  ])('supports class input $classes', async ({ classes, fullscreen }) => {
    const dialogClass = shallowRef(classes);
    const wrapper = mount(
      defineComponent({
        setup: () => () =>
          h(DialogRoot, { open: true }, () =>
            h(DialogContent, { class: dialogClass.value, showCloseButton: false }, () => [
              h(DialogTitle, {}, () => 'Title'),
              h(DialogDescription, {}, () => 'Content'),
            ])
          ),
      }),
      { attachTo: document.body }
    );
    try {
      await nextTick();
      const dialog = document.body.querySelector('[role="dialog"]');
      expect(dialog).not.toBeNull();
      expect(dialog?.classList.contains('data-[state=open]:slide-in-from-bottom')).toBe(fullscreen);
      expect(dialog?.classList.contains('data-[state=open]:zoom-in-95')).toBe(!fullscreen);
      dialogClass.value = fullscreen ? '' : 'min-h-screen';
      await nextTick();
      expect(dialog?.classList.contains('data-[state=open]:slide-in-from-bottom')).toBe(!fullscreen);
    } finally {
      wrapper.unmount();
    }
  });
});
