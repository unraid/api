import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, nextTick } from 'vue';

describe('useTeleport', () => {
  beforeEach(() => {
    // Reset modules before each test to ensure fresh state
    vi.resetModules();
    // Clear the DOM before each test
    document.body.innerHTML = '';
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.style.removeProperty('--theme-dark-mode');
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up virtual container if it exists
    const virtualContainer = document.getElementById('unraid-api-modals-virtual');
    if (virtualContainer) {
      virtualContainer.remove();
    }
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark');
    document.documentElement.style.removeProperty('--theme-dark-mode');
  });

  it('should return teleportTarget ref with correct value', async () => {
    const useTeleport = (await import('@/composables/useTeleport')).default;
    const { teleportTarget } = useTeleport();
    expect(teleportTarget.value).toBe('#unraid-api-modals-virtual');
  });

  it('should create virtual container element on mount with correct properties', async () => {
    const useTeleport = (await import('@/composables/useTeleport')).default;
    const TestComponent = defineComponent({
      setup() {
        const { teleportTarget } = useTeleport();
        return { teleportTarget };
      },
      template: '<div>{{ teleportTarget }}</div>',
    });

    // Initially, virtual container should not exist
    expect(document.getElementById('unraid-api-modals-virtual')).toBeNull();

    // Mount the component
    mount(TestComponent);
    await nextTick();

    // After mount, virtual container should be created with correct properties
    const virtualContainer = document.getElementById('unraid-api-modals-virtual');
    expect(virtualContainer).toBeTruthy();
    expect(virtualContainer?.className).toBe('unapi');
    expect(virtualContainer?.style.position).toBe('relative');
    expect(virtualContainer?.style.zIndex).toBe('999999');
    expect(virtualContainer?.parentElement).toBe(document.body);
  });

  it('should reuse existing virtual container within same test', async () => {
    const useTeleport = (await import('@/composables/useTeleport')).default;
    // Manually create the container first
    const manualContainer = document.createElement('div');
    manualContainer.id = 'unraid-api-modals-virtual';
    manualContainer.className = 'unapi';
    manualContainer.style.position = 'relative';
    manualContainer.style.zIndex = '999999';
    document.body.appendChild(manualContainer);

    const TestComponent = defineComponent({
      setup() {
        const { teleportTarget } = useTeleport();
        return { teleportTarget };
      },
      template: '<div>{{ teleportTarget }}</div>',
    });

    // Mount component - should not create a new container
    mount(TestComponent);
    await nextTick();

    // Should still have only one container
    const containers = document.querySelectorAll('#unraid-api-modals-virtual');
    expect(containers.length).toBe(1);
    expect(containers[0]).toBe(manualContainer);
  });

  it('should apply dark class when dark mode is active via CSS variable', async () => {
    const useTeleport = (await import('@/composables/useTeleport')).default;
    const originalGetComputedStyle = window.getComputedStyle;
    const getComputedStyleSpy = vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const style = originalGetComputedStyle(el);
      if (el === document.documentElement) {
        return {
          ...style,
          getPropertyValue: (prop: string) => {
            if (prop === '--theme-dark-mode') {
              return '1';
            }
            return style.getPropertyValue(prop);
          },
        } as CSSStyleDeclaration;
      }
      return style;
    });

    const TestComponent = defineComponent({
      setup() {
        const { teleportTarget } = useTeleport();
        return { teleportTarget };
      },
      template: '<div>{{ teleportTarget }}</div>',
    });

    const wrapper = mount(TestComponent);
    await nextTick();

    const virtualContainer = document.getElementById('unraid-api-modals-virtual');
    expect(virtualContainer).toBeTruthy();
    expect(virtualContainer?.classList.contains('dark')).toBe(true);

    wrapper.unmount();
    getComputedStyleSpy.mockRestore();
  });

  it('should not apply dark class when dark mode is inactive via CSS variable', async () => {
    const useTeleport = (await import('@/composables/useTeleport')).default;
    const originalGetComputedStyle = window.getComputedStyle;
    const getComputedStyleSpy = vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const style = originalGetComputedStyle(el);
      if (el === document.documentElement) {
        return {
          ...style,
          getPropertyValue: (prop: string) => {
            if (prop === '--theme-dark-mode') {
              return '0';
            }
            return style.getPropertyValue(prop);
          },
        } as CSSStyleDeclaration;
      }
      return style;
    });

    const TestComponent = defineComponent({
      setup() {
        const { teleportTarget } = useTeleport();
        return { teleportTarget };
      },
      template: '<div>{{ teleportTarget }}</div>',
    });

    const wrapper = mount(TestComponent);
    await nextTick();

    const virtualContainer = document.getElementById('unraid-api-modals-virtual');
    expect(virtualContainer).toBeTruthy();
    expect(virtualContainer?.classList.contains('dark')).toBe(false);

    wrapper.unmount();
    getComputedStyleSpy.mockRestore();
  });

  it('should apply dark class when dark mode is active via documentElement class', async () => {
    const useTeleport = (await import('@/composables/useTeleport')).default;
    document.documentElement.classList.add('dark');

    const originalGetComputedStyle = window.getComputedStyle;
    const getComputedStyleSpy = vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const style = originalGetComputedStyle(el);
      if (el === document.documentElement) {
        return {
          ...style,
          getPropertyValue: (prop: string) => {
            if (prop === '--theme-dark-mode') {
              return '';
            }
            return style.getPropertyValue(prop);
          },
        } as CSSStyleDeclaration;
      }
      return style;
    });

    const TestComponent = defineComponent({
      setup() {
        const { teleportTarget } = useTeleport();
        return { teleportTarget };
      },
      template: '<div>{{ teleportTarget }}</div>',
    });

    const wrapper = mount(TestComponent);
    await nextTick();

    const virtualContainer = document.getElementById('unraid-api-modals-virtual');
    expect(virtualContainer).toBeTruthy();
    expect(virtualContainer?.classList.contains('dark')).toBe(true);

    wrapper.unmount();
    getComputedStyleSpy.mockRestore();
    document.documentElement.classList.remove('dark');
  });
});
