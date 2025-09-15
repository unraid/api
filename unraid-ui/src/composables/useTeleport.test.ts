import useTeleport from '@/composables/useTeleport';
import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent } from 'vue';

describe('useTeleport', () => {
  beforeEach(() => {
    // Clear the DOM before each test
    document.body.innerHTML = '';
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up virtual container if it exists
    const virtualContainer = document.getElementById('unraid-api-modals-virtual');
    if (virtualContainer) {
      virtualContainer.remove();
    }
    // Reset the module to clear the virtualModalContainer variable
    vi.resetModules();
  });

  it('should return teleportTarget ref with correct value', () => {
    const { teleportTarget } = useTeleport();
    expect(teleportTarget.value).toBe('#unraid-api-modals-virtual');
  });

  it('should create virtual container element on mount with correct properties', () => {
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

    // After mount, virtual container should be created with correct properties
    const virtualContainer = document.getElementById('unraid-api-modals-virtual');
    expect(virtualContainer).toBeTruthy();
    expect(virtualContainer?.className).toBe('unapi');
    expect(virtualContainer?.style.position).toBe('relative');
    expect(virtualContainer?.style.zIndex).toBe('999999');
    expect(virtualContainer?.parentElement).toBe(document.body);
  });

  it('should reuse existing virtual container within same test', () => {
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

    // Should still have only one container
    const containers = document.querySelectorAll('#unraid-api-modals-virtual');
    expect(containers.length).toBe(1);
    expect(containers[0]).toBe(manualContainer);
  });
});
